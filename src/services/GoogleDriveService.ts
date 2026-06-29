import { encrypt, decrypt, SecureStorage } from "../utils/encryption";
import { AsyncStorageService } from "./AsyncStorageService";

export const GOOGLE_CLIENT_ID = import.meta.env.DEV
  ? "765227702920-ea76st8tpgl5nvognrbomtr3ctm27vm6.apps.googleusercontent.com"
  : "765227702920-lnphp8oe0b5pgjm1uq5ksgdi84j5p014.apps.googleusercontent.com";

const GOOGLE_TOKEN_KEY = "@fireheart_google_token";
const GOOGLE_TOKEN_EXPIRY_KEY = "@fireheart_google_token_expiry";

export interface GoogleUser {
  email: string;
  name: string;
  avatar?: string;
}

export interface BackupFile {
  id: string;          // File ID in Drive, or local URI
  name: string;        // Filename
  createdTime: string; // ISO 8601 stringS
}

const folderPromises: Record<string, Promise<string> | undefined> = {};

export const GoogleDriveService = {
  // --- Client ID configuration ---
  async getClientId(): Promise<string> {
    return GOOGLE_CLIENT_ID;
  },

  // --- Google OAuth ---
  async getAccessToken(): Promise<string | null> {
    const token = SecureStorage.getItem(GOOGLE_TOKEN_KEY);
    if (!token) return null;

    const expiryStr = SecureStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (!isNaN(expiry) && expiry < Date.now()) {
        console.log("Google session expired. Logging out...");
        await this.logoutGoogle();
        return null;
      }
    }
    return token;
  },

  async saveAccessToken(token: string, expiresInSeconds?: number): Promise<void> {
    SecureStorage.setItem(GOOGLE_TOKEN_KEY, token);
    const seconds = expiresInSeconds && !isNaN(expiresInSeconds) ? expiresInSeconds : 3600;
    const expiryTime = Date.now() + seconds * 1000;
    SecureStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, expiryTime.toString());
  },

  async logoutGoogle(): Promise<void> {
    SecureStorage.removeItem(GOOGLE_TOKEN_KEY);
    SecureStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  },

  /**
   * Performs Google OAuth Login using browser popup window.
   */
  async loginGoogle(): Promise<GoogleUser> {
    const clientId = await this.getClientId();
    if (!clientId) {
      throw new Error("Vui lòng điền GOOGLE_CLIENT_ID trong file src/services/GoogleDriveService.ts trước khi đăng nhập.");
    }

    const redirectUri = `${window.location.origin}/oauth-callback.html`;
    const scopes = [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent(scopes)}`;

    // Calculate center coordinates for popup
    const width = 550;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      "google-oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      throw new Error("Popup đã bị chặn bởi trình duyệt. Vui lòng cho phép popup để đăng nhập bằng Google.");
    }

    return new Promise<GoogleUser>((resolve, reject) => {
      const listener = async (event: MessageEvent) => {
        // Enforce same origin security
        if (event.origin !== window.location.origin) return;

        if (event.data && event.data.type === "GOOGLE_OAUTH_TOKEN") {
          window.removeEventListener("message", listener);
          clearInterval(checkClosed);

          const token = event.data.token;
          const expiresIn = event.data.expiresIn ? parseInt(event.data.expiresIn, 10) : undefined;
          await this.saveAccessToken(token, expiresIn);

          try {
            const userInfo = await this.getGoogleUserInfo();
            if (userInfo) {
              resolve(userInfo);
            } else {
              reject(new Error("Không thể tải thông tin cá nhân từ Google."));
            }
          } catch (err) {
            reject(err);
          }
        } else if (event.data && event.data.type === "GOOGLE_OAUTH_ERROR") {
          window.removeEventListener("message", listener);
          clearInterval(checkClosed);
          reject(new Error(`Lỗi đăng nhập Google: ${event.data.error}`));
        }
      };

      window.addEventListener("message", listener);

      // Check if popup has been closed manually by user
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", listener);
          reject(new Error("Cửa sổ đăng nhập Google bị đóng trước khi hoàn tất."));
        }
      }, 1000);
    });
  },

  /**
   * Fetches logged in user details from Google userinfo endpoint
   */
  async getGoogleUserInfo(): Promise<GoogleUser | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          email: data.email || "",
          name: data.name || "",
          avatar: data.picture || undefined,
        };
      }
    } catch (error) {
      console.error("Failed to fetch Google profile:", error);
    }
    return null;
  },

  // --- Image Upload Operation ---
  /**
   * Uploads an image blob URL or data URL to Google Drive.
   * Creates folder structure: DateDiaryData -> DateDiaryPicture and uploads the file.
   */
  async uploadImage(localUri: string): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("Chưa kết nối tài khoản Google Drive. Vui lòng đăng nhập trong mục Cài đặt trước.");

    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    const fileName = `date_diary_utc_${timestamp}.jpg`;

    // 1. Check or create folder structure in Google Drive
    const rootFolderId = await this.getOrCreateDriveFolder("DateDiaryData", token);
    const pictureRootFolderId = await this.getOrCreateDriveFolder("DateDiaryPicture", token, rootFolderId);

    // 2. Upload file directly to DateDiaryPicture
    const fileId = await this.uploadToDrive(localUri, fileName, "image/jpeg", pictureRootFolderId, token);

    // 3. Return a web-viewable URL (Google Drive thumbnail pattern is more reliable than lh3)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  },

  async findFileInFolder(fileName: string, folderId: string): Promise<string | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=files(id)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }
    return null;
  },

  async uploadAvatar(localUri: string, gender: "Nam" | "Nữ"): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("Chưa kết nối tài khoản Google Drive. Vui lòng đăng nhập trong mục Cài đặt trước.");

    // 1. Get or create root structure
    const rootFolderId = await this.getOrCreateDriveFolder("DateDiaryData", token);
    const pictureRootFolderId = await this.getOrCreateDriveFolder("DateDiaryPicture", token, rootFolderId);
    const profileFolderId = await this.getOrCreateDriveFolder("Profile", token, pictureRootFolderId);

    const fileName = gender === "Nam" ? "boy_avatar.jpg" : "girl_avatar.jpg";

    // 2. Check if old avatar exists, and delete it to overwrite
    const oldFileId = await this.findFileInFolder(fileName, profileFolderId);
    if (oldFileId) {
      try {
        await this.deleteFile(oldFileId);
      } catch (err) {
        console.warn("Failed to delete old profile avatar:", err);
      }
    }

    // 3. Upload new avatar directly to Profile folder
    const fileId = await this.uploadToDrive(localUri, fileName, "image/jpeg", profileFolderId, token);

    // 4. Return the public URL
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  },

  // --- Backup Operation ---
  async performBackup(): Promise<{ fileName: string; totalBackups: number; deletedCount: number }> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("Chưa kết nối tài khoản Google Drive. Vui lòng đăng nhập trong mục Cài đặt trước.");

    // 1. Prepare backup payload
    const backupData = await AsyncStorageService.exportRawBackup();
    const rawJson = JSON.stringify({ tables: backupData }, null, 2);

    // 2. Save backup file with timestamp filename
    const dateFormatted = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const fileName = `backup_${dateFormatted}.json`;

    // 3. Get or create parent folder "DateDiaryBackup" under "DateDiaryData"
    const rootFolderId = await this.getOrCreateDriveFolder("DateDiaryData", token);
    const parentFolderId = await this.getOrCreateDriveFolder("DateDiaryBackup", token, rootFolderId);

    // 4. Upload encrypted backup file
    const encryptedContent = encrypt(rawJson);
    await this.uploadTextToDrive(encryptedContent, fileName, parentFolderId, token);

    // 5. Enforce cloud retention limit
    const pruneResult = await this.pruneBackups();
    return {
      fileName,
      totalBackups: pruneResult.totalBackups,
      deletedCount: pruneResult.deletedCount,
    };
  },

  // --- List Backups ---
  async listBackups(): Promise<BackupFile[]> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("Chưa kết nối tài khoản Google Drive. Vui lòng đăng nhập trong mục Cài đặt trước.");

    const rootFolderId = await this.getOrCreateDriveFolder("DateDiaryData", token);
    const parentFolderId = await this.getOrCreateDriveFolder("DateDiaryBackup", token, rootFolderId);
    const query = `name contains 'backup_' and name contains '.json' and '${parentFolderId}' in parents and trashed = false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&orderBy=createdTime desc&pageSize=100&fields=files(id,name,createdTime)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error("Không thể tải danh sách sao lưu từ Google Drive.");
    }

    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
    }));
  },

  // --- Prune Backup Retention (Limit to 5 newest if total is > 20) ---
  async pruneBackups(): Promise<{ totalBackups: number; deletedCount: number }> {
    let totalBackups = 0;
    let deletedCount = 0;
    try {
      const backups = await this.listBackups();
      totalBackups = backups.length;
      if (backups.length > 20) {
        const toDelete = backups.slice(5);
        deletedCount = toDelete.length;
        const token = await this.getAccessToken();
        if (!token) return { totalBackups, deletedCount: 0 };

        for (const item of toDelete) {
          console.log(`[Prune] Deleting backup: ${item.name} (${item.id})`);
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${item.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            const errText = await res.text();
            console.error(`[Prune] Failed to delete ${item.name}:`, errText);
          } else {
            console.log(`[Prune] Successfully deleted ${item.name}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to prune old backups:", error);
    }
    return { totalBackups, deletedCount };
  },

  // --- Restore Operation ---
  async restoreBackup(backupIdOrUri: string): Promise<void> {
    let encryptedContent = "";

    const token = await this.getAccessToken();
    if (!token) throw new Error("Chưa kết nối tài khoản Google Drive. Vui lòng đăng nhập trong mục Cài đặt trước.");

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${backupIdOrUri}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Không thể tải file sao lưu từ Google Drive.");
    }
    encryptedContent = await response.text();

    if (!encryptedContent) throw new Error("Nội dung file trống.");

    // Decrypt using XOR key
    const decryptedJson = decrypt(encryptedContent);
    if (!decryptedJson) throw new Error("Mã hóa sai hoặc file bị hỏng.");

    const parsed = JSON.parse(decryptedJson);
    if (!parsed.tables) throw new Error("Cấu trúc file sao lưu không hợp lệ.");

    // Import tables back to database
    await AsyncStorageService.importRawBackup(parsed.tables);
  },

  // --- Helper Methods for Google Drive API ---
  async getOrCreateDriveFolder(folderName: string, token: string, parentId?: string): Promise<string> {
    const cacheKey = `${folderName}_${parentId || "root"}`;
    if (folderPromises[cacheKey]) {
      return folderPromises[cacheKey]!;
    }

    const promise = (async () => {
      try {
        let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        if (parentId) {
          query += ` and '${parentId}' in parents`;
        } else {
          query += ` and 'root' in parents`;
        }
        const checkRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!checkRes.ok) {
          let checkErr = "";
          try {
            const errData = await checkRes.json();
            checkErr = errData?.error?.message || JSON.stringify(errData);
          } catch (_) {
            checkErr = checkRes.statusText;
          }
          throw new Error(`Kiểm tra thư mục thất bại: ${checkErr}`);
        }

        const data = await checkRes.json();
        if (data.files && data.files.length > 0) {
          return data.files[0].id;
        }

        // Create folder
        const body: any = {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        };
        if (parentId) {
          body.parents = [parentId];
        }

        const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!createRes.ok) {
          let createErr = "";
          try {
            const errData = await createRes.json();
            createErr = errData?.error?.message || JSON.stringify(errData);
          } catch (_) {
            createErr = createRes.statusText;
          }
          throw new Error(`Không thể tạo thư mục ${folderName} trên Google Drive. Chi tiết: ${createErr}`);
        }

        const createData = await createRes.json();
        return createData.id;
      } catch (error) {
        // Clear from cache on failure so we can retry later
        delete folderPromises[cacheKey];
        throw error;
      }
    })();

    folderPromises[cacheKey] = promise;
    return promise;
  },

  async uploadToDrive(localUri: string, fileName: string, mimeType: string, folderId: string, token: string): Promise<string> {
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    const boundary = "foo_bar_boundary";

    // Read blob URL as base64 string
    const response = await fetch(localUri);
    const blob = await response.blob();
    const base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arr = (reader.result as string).split(",");
        resolve(arr[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    let multipartBody = `--${boundary}\r\n`;
    multipartBody += `Content-Type: application/json; charset=UTF-8\r\n\r\n`;
    multipartBody += `${JSON.stringify(metadata)}\r\n`;
    multipartBody += `--${boundary}\r\n`;
    multipartBody += `Content-Type: ${mimeType}\r\n`;
    multipartBody += `Content-Transfer-Encoding: base64\r\n\r\n`;
    multipartBody += `${base64Content}\r\n`;
    multipartBody += `--${boundary}--`;

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Drive upload failed:", err);
      throw new Error(`Upload file ảnh lên Drive thất bại.`);
    }

    const data = await res.json();

    // Make file viewable publicly
    await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    });

    return data.id;
  },

  async uploadTextToDrive(content: string, fileName: string, folderId: string, token: string): Promise<void> {
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const boundary = "foo_bar_boundary_txt";
    let multipartBody = `--${boundary}\r\n`;
    multipartBody += `Content-Type: application/json; charset=UTF-8\r\n\r\n`;
    multipartBody += `${JSON.stringify(metadata)}\r\n`;
    multipartBody += `--${boundary}\r\n`;
    multipartBody += `Content-Type: text/plain\r\n\r\n`;
    multipartBody += `${content}\r\n`;
    multipartBody += `--${boundary}--`;

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Backup file upload failed:", err);
      throw new Error(`Upload file sao lưu lên Drive thất bại.`);
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("Chưa kết nối tài khoản Google Drive.");

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errMsg = await res.text();
      console.warn(`Failed to delete file ${fileId} from Drive:`, errMsg);
    }
  },

  getFileIdFromUrl(url: string): string | null {
    // Pattern: https://lh3.googleusercontent.com/d/[FILE_ID]=s800
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  },

  resolveDriveUrl(url: string | undefined | null, size: number = 800): string {
    if (!url) return "";
    if (url.includes("googleusercontent.com") || url.includes("drive.google.com") || url.includes("docs.google.com")) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}=s${size}`;
      }
    }
    return url;
  },

  async uploadBackground(localUri: string, type: "desktop" | "mobile"): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("Chưa kết nối tài khoản Google Drive. Vui lòng đăng nhập trước.");

    const rootFolderId = await this.getOrCreateDriveFolder("DateDiaryData", token);
    const bgFolderId = await this.getOrCreateDriveFolder("DateDiaryBackground", token, rootFolderId);

    // Delete existing background files of the same type to maintain exactly 1 image per type
    const query = `'${bgFolderId}' in parents and name contains 'background_${type}' and trashed = false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          try {
            await this.deleteFile(file.id);
          } catch (err) {
            console.warn(`Failed to delete old ${type} background file:`, err);
          }
        }
      }
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const fileName = `background_${type}_${timestamp}.jpg`;

    const fileId = await this.uploadToDrive(localUri, fileName, "image/jpeg", bgFolderId, token);
    return `https://lh3.googleusercontent.com/d/${fileId}=s1920`;
  },

  async deleteBackgroundOnDrive(type: "desktop" | "mobile"): Promise<void> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("Chưa kết nối tài khoản Google Drive.");

    const rootFolderId = await this.getOrCreateDriveFolder("DateDiaryData", token);
    const bgFolderId = await this.getOrCreateDriveFolder("DateDiaryBackground", token, rootFolderId);

    const query = `'${bgFolderId}' in parents and name contains 'background_${type}' and trashed = false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          await this.deleteFile(file.id);
        }
      }
    }
  },

  async syncBackgroundFromDrive(type: "desktop" | "mobile"): Promise<string | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    try {
      const rootFolderId = await this.getOrCreateDriveFolder("DateDiaryData", token);
      const bgFolderId = await this.getOrCreateDriveFolder("DateDiaryBackground", token, rootFolderId);

      const query = `'${bgFolderId}' in parents and name contains 'background_${type}' and trashed = false`;
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          return `https://lh3.googleusercontent.com/d/${data.files[0].id}=s1920`;
        }
      }

      // Legacy fallback for desktop background
      if (type === "desktop") {
        const fallbackQuery = `'${bgFolderId}' in parents and name contains 'background_' and not name contains 'background_mobile' and not name contains 'background_desktop' and trashed = false`;
        const fallbackRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fallbackQuery)}&fields=files(id)`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.files && fallbackData.files.length > 0) {
            return `https://lh3.googleusercontent.com/d/${fallbackData.files[0].id}=s1920`;
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to sync ${type} background from Drive:`, e);
    }
    return null;
  },
};
