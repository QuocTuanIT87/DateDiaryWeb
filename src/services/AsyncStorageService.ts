import { db } from "./firebase";
import { ref, get, set, remove } from "firebase/database";
import {
  encrypt,
  decrypt,
  isEncrypted,
  encryptUser,
  decryptUser,
  encryptType,
  decryptType,
  encryptHistoryItem,
  decryptHistoryItem,
  SecureStorage,
} from "../utils/encryption";



// Types definition
export interface DateHistory {
  id: string;
  time: string; // ISO 8601
  type: string; // Type name or ID
  note: string;
  imageList: string[]; // Google Drive links
  reason: string;
}

export interface DateType {
  id: string;
  name: string;
  deleteAt?: string | null;
}

export interface DateUser {
  id: string; // 'user_1' or 'user_2'
  name: string;
  phone: string;
  facebook: string;
  tiktok: string;
  interest: string[];
  dislike: string[];
  hate: string[];
  height: number;
  weight: number;
  birthday: string; // YYYY-MM-DD
  gender: "Nam" | "Nữ";
  shoeSize?: string;
  shirtSize?: string;
  avatar?: string;
}

export interface DateStartTime {
  acquaintedDay: string; // ngày 29/9/2025 16:00
  confessionDay: string; // ngày 1/1/2026 21:30
}

// Fixed milestones, read-only
const DATE_START_TIME: DateStartTime = {
  acquaintedDay: "2025-09-29T16:00:00+07:00",
  confessionDay: "2026-01-01T21:30:00+07:00",
};

// Default Date Types to seed on first run
const DEFAULT_DATE_TYPES: DateType[] = [
  { id: "type_1", name: "Đi ăn uống 🍽️" },
  { id: "type_2", name: "Xem phim 🎬" },
  { id: "type_3", name: "Đi dạo phố 🚶‍♂️🚶‍♀️" },
  { id: "type_4", name: "Cà phê trò chuyện ☕" },
  { id: "type_5", name: "Du lịch nghỉ dưỡng ✈️" },
];

const DB_PREFIX = "/MayTrangSatsBoy";
const dbRef = (path?: string) => ref(db, path ? DB_PREFIX + path : DB_PREFIX);

export const AsyncStorageService = {
  // --- Start Milestones ---
  getStartTime(): DateStartTime {
    return DATE_START_TIME;
  },

  // --- DateUser Operations ---
  async getUsers(): Promise<DateUser[]> {
    try {
      const snapshot = await get(dbRef("/users"));
      const val = snapshot.val();
      if (!val) return [];
      if (typeof val === "string") {
        const decrypted = decrypt(val);
        if (!decrypted) return [];
        const parsed = JSON.parse(decrypted) as DateUser[];
        // Auto-migrate to new field-level encrypted format
        await set(dbRef("/users"), parsed.map(encryptUser));
        return parsed;
      }
      if (Array.isArray(val) || typeof val === "object") {
        const list: any[] = Array.isArray(val) ? val : Object.values(val);
        const parsed = list.filter(Boolean).map(decryptUser);
        const needsReSave = list.some(item => item && !isEncrypted(item.name));
        if (needsReSave) {
          await set(dbRef("/users"), parsed.map(encryptUser));
        }
        return parsed;
      }
      return [];
    } catch (error) {
      console.error("Firebase getUsers failed:", error);
      return [];
    }
  },

  async saveUsers(user1: DateUser, user2: DateUser): Promise<void> {
    // Force specific IDs for consistent 2-user layout
    const formattedUser1 = { ...user1, id: "user_1" };
    const formattedUser2 = { ...user2, id: "user_2" };
    const data = [formattedUser1, formattedUser2];
    await set(dbRef("/users"), data.map(encryptUser));
  },

  // --- DateType Operations ---
  async getTypes(includeArchived = false): Promise<DateType[]> {
    try {
      const snapshot = await get(dbRef("/types"));
      const val = snapshot.val();
      let types: DateType[] | null = null;
      if (val !== null) {
        if (typeof val === "string") {
          const decrypted = decrypt(val);
          if (decrypted) {
            types = JSON.parse(decrypted) as DateType[];
            await set(dbRef("/types"), types.map(encryptType));
          }
        } else if (Array.isArray(val) || typeof val === "object") {
          const list: any[] = Array.isArray(val) ? val : Object.values(val);
          types = list.filter(Boolean).map(decryptType);
          const needsReSave = list.some(item => item && !isEncrypted(item.name));
          if (needsReSave) {
            await set(dbRef("/types"), types.map(encryptType));
          }
        }
      }
      if (types === null) {
        // Seed default types
        await set(dbRef("/types"), DEFAULT_DATE_TYPES.map(encryptType));
        types = DEFAULT_DATE_TYPES;
      }
      if (!includeArchived) {
        return types.filter(t => !t.deleteAt);
      }
      return types;
    } catch (error) {
      console.error("Firebase getTypes failed:", error);
      return [];
    }
  },

  async saveTypes(types: DateType[]): Promise<void> {
    await set(dbRef("/types"), types.map(encryptType));
  },

  async addType(name: string): Promise<DateType> {
    const types = await this.getTypes(true);

    // Check if there is an archived category with the same name (case-insensitive)
    const archivedIndex = types.findIndex(
      (t) => t.name.toLowerCase() === name.trim().toLowerCase() && t.deleteAt
    );

    if (archivedIndex !== -1) {
      // Restore it
      types[archivedIndex].deleteAt = null;
      await this.saveTypes(types);
      return types[archivedIndex];
    }

    // Check if there is an active category with the same name, to avoid duplication
    const activeExist = types.find(
      (t) => t.name.toLowerCase() === name.trim().toLowerCase() && !t.deleteAt
    );
    if (activeExist) {
      return activeExist;
    }

    const newType: DateType = {
      id: `type_${Date.now()}`,
      name: name.trim(),
      deleteAt: null,
    };
    types.push(newType);
    await this.saveTypes(types);
    return newType;
  },

  async updateType(id: string, newName: string): Promise<void> {
    const types = await this.getTypes(true);
    const index = types.findIndex((t) => t.id === id);
    if (index !== -1) {
      types[index].name = newName.trim();
      await this.saveTypes(types);
    }
  },

  async deleteType(id: string): Promise<void> {
    const types = await this.getTypes(true);
    const targetType = types.find((t) => t.id === id);
    if (!targetType) return;

    const history = await this.getHistory();
    const isLinked = history.some(
      (h) => h.type.toLowerCase() === targetType.name.toLowerCase()
    );

    let updatedTypes: DateType[];
    if (isLinked) {
      // Archive it: set deleteAt to the current date/time
      updatedTypes = types.map((t) => {
        if (t.id === id) {
          return { ...t, deleteAt: new Date().toISOString() };
        }
        return t;
      });
    } else {
      // Delete completely
      updatedTypes = types.filter((t) => t.id !== id);
    }

    await this.saveTypes(updatedTypes);
  },

  // --- DateHistory Operations ---
  async getHistory(): Promise<DateHistory[]> {
    try {
      const snapshot = await get(dbRef("/history"));
      const val = snapshot.val();
      if (!val) return [];
      if (typeof val === "string") {
        const decrypted = decrypt(val);
        if (!decrypted) return [];
        const parsed = JSON.parse(decrypted) as DateHistory[];
        await set(dbRef("/history"), parsed.map(encryptHistoryItem));
        return parsed;
      }
      if (Array.isArray(val) || typeof val === "object") {
        const list: any[] = Array.isArray(val) ? val : Object.values(val);
        const parsed = list.filter(Boolean).map(decryptHistoryItem);
        const needsReSave = list.some(item => item && !isEncrypted(item.time));
        if (needsReSave) {
          await set(dbRef("/history"), parsed.map(encryptHistoryItem));
        }
        return parsed;
      }
      return [];
    } catch (error) {
      console.error("Firebase getHistory failed:", error);
      return [];
    }
  },

  async saveHistoryList(history: DateHistory[]): Promise<void> {
    await set(dbRef("/history"), history.map(encryptHistoryItem));
  },

  async addHistoryItem(item: Omit<DateHistory, "id">): Promise<DateHistory> {
    const history = await this.getHistory();
    const newItem: DateHistory = {
      ...item,
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };
    history.unshift(newItem); // New events at the top
    await this.saveHistoryList(history);
    return newItem;
  },

  async updateHistoryItem(id: string, updatedFields: Partial<Omit<DateHistory, "id">>): Promise<void> {
    const history = await this.getHistory();
    const index = history.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error("Không tìm thấy sự kiện cần cập nhật.");
    }

    const currentItem = history[index];

    // Merge modifications
    history[index] = {
      ...currentItem,
      ...updatedFields,
    };
    await this.saveHistoryList(history);
  },

  async deleteHistoryItem(id: string): Promise<void> {
    const history = await this.getHistory();
    const index = history.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error("Không tìm thấy sự kiện cần xóa.");
    }

    const filtered = history.filter((h) => h.id !== id);
    await this.saveHistoryList(filtered);
  },

  // --- Clear & Import ---
  async clearAll(): Promise<void> {
    await remove(dbRef());
    // Clear secure storage keys
    SecureStorage.removeItem("@fireheart_google_token");
    SecureStorage.removeItem("@fireheart_security_passed");
    SecureStorage.removeItem("@fireheart_security_lock");
    // Clear raw plain-text keys (legacy)
    localStorage.removeItem("@fireheart_google_token");
    localStorage.removeItem("@fireheart_security_passed");
    localStorage.removeItem("@fireheart_security_lock");
    // Explicitly delete any old migration keys if they exist in localStorage
    localStorage.removeItem("@fireheart_firebase_migration_done");
    localStorage.removeItem("@fireheart_firebase_encryption_migration_done");
    localStorage.removeItem("@fireheart_firebase_field_encryption_migration_done_v2");
  },

  /**
   * Imports raw database tables, used for restoration.
   */
  async importRawBackup(data: { history: any; types: any; users: any }): Promise<void> {
    if (data.users) {
      let parsedUsers: DateUser[] = [];
      if (typeof data.users === "string") {
        const decrypted = decrypt(data.users);
        if (decrypted) parsedUsers = JSON.parse(decrypted);
      } else {
        const list = Array.isArray(data.users) ? data.users : Object.values(data.users);
        parsedUsers = list.filter(Boolean).map(decryptUser);
      }
      await set(dbRef("/users"), parsedUsers.map(encryptUser));
    } else {
      throw new Error("Dữ liệu sao lưu không chứa đúng người dùng.");
    }

    if (data.types) {
      let parsedTypes: DateType[] = [];
      if (typeof data.types === "string") {
        const decrypted = decrypt(data.types);
        if (decrypted) parsedTypes = JSON.parse(decrypted);
      } else {
        const list = Array.isArray(data.types) ? data.types : Object.values(data.types);
        parsedTypes = list.filter(Boolean).map(decryptType);
      }
      await set(dbRef("/types"), parsedTypes.map(encryptType));
    }

    if (data.history) {
      let parsedHistory: DateHistory[] = [];
      if (typeof data.history === "string") {
        const decrypted = decrypt(data.history);
        if (decrypted) parsedHistory = JSON.parse(decrypted);
      } else {
        const list = Array.isArray(data.history) ? data.history : Object.values(data.history);
        parsedHistory = list.filter(Boolean).map(decryptHistoryItem);
      }
      await set(dbRef("/history"), parsedHistory.map(encryptHistoryItem));
    }
  },

  /**
   * Exports raw database tables as JSON, used for backup creation.
   */
  async exportRawBackup(): Promise<{ history: any; types: any; users: any }> {
    const snapshotHistory = await get(dbRef("/history"));
    const snapshotTypes = await get(dbRef("/types"));
    const snapshotUsers = await get(dbRef("/users"));

    return {
      history: snapshotHistory.val() || [],
      types: snapshotTypes.val() || [],
      users: snapshotUsers.val() || [],
    };
  },

  async getBackgroundUrl(): Promise<string | null> {
    try {
      const snapshot = await get(dbRef("/background"));
      const val = snapshot.val();
      if (!val) return null;
      if (typeof val === "string") {
        const decrypted = decrypt(val);
        return decrypted || val;
      }
      return null;
    } catch (error) {
      console.error("Firebase getBackgroundUrl failed:", error);
      return null;
    }
  },

  async setBackgroundUrl(url: string | null): Promise<void> {
    try {
      if (url === null) {
        await remove(dbRef("/background"));
      } else {
        const encrypted = encrypt(url);
        await set(dbRef("/background"), encrypted);
      }
    } catch (error) {
      console.error("Firebase setBackgroundUrl failed:", error);
      throw error;
    }
  },
};
