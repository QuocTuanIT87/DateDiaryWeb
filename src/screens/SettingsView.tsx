import React, { useState, useEffect, useRef } from "react";
import {
  AsyncStorageService,
  type DateType,
} from "../services/AsyncStorageService";
import {
  GoogleDriveService,
  type GoogleUser,
} from "../services/GoogleDriveService";
import { useApp } from "../context/AppContext";
import { CustomAlert } from "../components/CustomAlert";
import { StatsView } from "./StatsView";
import {
  IoCloudDoneOutline,
  IoCloudOfflineOutline,
  IoLogoGoogle,
  IoListOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoAddOutline,
  IoImageOutline,
} from "react-icons/io5";

export const SettingsView: React.FC = () => {
  const { backgroundImage, updateBackgroundImage } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [types, setTypes] = useState<DateType[]>([]);
  const [loading, setLoading] = useState(false);

  // Google OAuth States
  const [clientId, setClientId] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

  // Stats Subview State
  const [showStats, setShowStats] = useState(false);

  // Category CRUD modal state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<DateType | null>(null);
  const [typeName, setTypeName] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await AsyncStorageService.getTypes();
      setTypes(list);

      const id = await GoogleDriveService.getClientId();
      setClientId(id);

      const connected = await GoogleDriveService.isLoggedIn();
      setGoogleConnected(connected);

      if (connected) {
        const userInfo = await GoogleDriveService.getGoogleUserInfo();
        setGoogleUser(userInfo);
      } else {
        setGoogleUser(null);
      }
    } catch (e) {
      console.error("Load settings details failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGoogleLogin = async () => {
    if (!clientId.trim()) {
      CustomAlert.alert(
        "Yêu cầu",
        "Vui lòng cấu hình GOOGLE_CLIENT_ID trong file src/services/GoogleDriveService.ts trước khi đăng nhập.",
      );
      return;
    }
    try {
      setLoading(true);
      const userInfo = await GoogleDriveService.loginGoogle();
      setGoogleConnected(true);
      setGoogleUser(userInfo);

      // Sync background from Drive after login
      const driveBg = await GoogleDriveService.syncBackgroundFromDrive();
      if (driveBg) {
        await updateBackgroundImage(driveBg);
      }

      CustomAlert.success(
        "Thành công",
        "Kết nối tài khoản Google Drive thành công!",
      );
    } catch (e: any) {
      console.error("Google Login Error:", e);
      CustomAlert.alert(
        "Lỗi đăng nhập",
        e.message || "Không thể kết nối tài khoản Google.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      setLoading(true);
      await GoogleDriveService.logoutGoogle();
      setGoogleConnected(false);
      setGoogleUser(null);
      CustomAlert.success("Đã đăng xuất", "Đã ngắt kết nối tài khoản Google.");
    } catch (e) {
      CustomAlert.alert("Lỗi", "Không thể đăng xuất.");
    } finally {
      setLoading(false);
    }
  };

  // Background Image Handlers
  const handleUploadBackground = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const localUri = URL.createObjectURL(file);

    try {
      setLoading(true);
      const driveUrl = await GoogleDriveService.uploadBackground(localUri);
      await updateBackgroundImage(driveUrl);
      CustomAlert.success(
        "Thành công",
        "Đã tải lên và thiết lập hình nền website mới!",
      );
    } catch (err: any) {
      console.error("Upload background error:", err);
      CustomAlert.alert(
        "Lỗi",
        err.message || "Không thể tải hình nền lên Google Drive.",
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteBackground = () => {
    CustomAlert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa hình nền website và quay về nền mặc định?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await GoogleDriveService.deleteBackgroundOnDrive();
              await updateBackgroundImage(null);
              CustomAlert.success("Thành công", "Đã xóa hình nền website.");
            } catch (err: any) {
              console.error("Delete background error:", err);
              CustomAlert.alert("Lỗi", "Không thể xóa hình nền trên Drive.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Categories CRUD
  const handleOpenAddType = () => {
    setEditingType(null);
    setTypeName("");
    setShowTypeModal(true);
  };

  const handleOpenEditType = (type: DateType) => {
    setEditingType(type);
    setTypeName(type.name);
    setShowTypeModal(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) {
      CustomAlert.alert("Lỗi", "Tên loại hoạt động không được để trống.");
      return;
    }

    try {
      setLoading(true);
      if (editingType) {
        await AsyncStorageService.updateType(editingType.id, typeName);
      } else {
        await AsyncStorageService.addType(typeName);
      }
      const list = await AsyncStorageService.getTypes();
      setTypes(list);
      setShowTypeModal(false);
    } catch (e) {
      CustomAlert.alert("Lỗi", "Không thể lưu hoạt động.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (id: string) => {
    CustomAlert.alert(
      "Xác nhận xóa",
      "Bạn muốn xóa loại hoạt động này? Lịch sử cũ có loại này vẫn được giữ nguyên nhưng loại này sẽ biến mất khỏi danh sách chọn khi thêm mới.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await AsyncStorageService.deleteType(id);
              const list = await AsyncStorageService.getTypes();
              setTypes(list);
            } catch (e) {
              CustomAlert.alert("Lỗi", "Không thể xóa loại hoạt động.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Perform manual backup sync
  const handleBackupNow = async () => {
    try {
      setLoading(true);
      const fileName = await GoogleDriveService.performBackup();
      CustomAlert.success(
        "Sao lưu thành công",
        `Đã lưu bản sao lưu thành file JSON trên Google Drive:\n${fileName}`,
      );
    } catch (e: any) {
      CustomAlert.alert(
        "Lỗi sao lưu",
        e.message || "Không thể thực hiện sao lưu.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (showStats) {
    return <StatsView onBack={() => setShowStats(false)} />;
  }

  return (
    <div
      className="container animate-fade"
      style={{ paddingBottom: "40px", flex: 1 }}
    >
      {/* Title */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "20px",
            color: "var(--text)",
          }}
        >
          Cấu hình Hệ thống ⚙️
        </h2>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "2px",
          }}
        >
          Quản lý tài khoản đồng bộ Drive và phân mục hoạt động
        </p>
      </div>

      {/* Loading overlay spinner */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(248, 251, 254, 0.6)",
            zIndex: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="spinner"></div>
        </div>
      )}

      {/* Two-column layout for widescreen */}
      <div className="two-col-grid">
        {/* Left Column: Sync, Backups & Danger Zone */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* SECTION 1: Google Drive Sync */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {googleConnected ? (
                <IoCloudDoneOutline size={18} color="var(--success)" />
              ) : (
                <IoCloudOfflineOutline size={18} color="var(--lock)" />
              )}
              <span>Kết nối Google Drive</span>
            </h3>

            {googleConnected && googleUser ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    backgroundColor: "var(--background)",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {googleUser.avatar ? (
                    <img
                      src={googleUser.avatar}
                      alt="Avatar Google"
                      referrerPolicy="no-referrer"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        border: "1px solid var(--border)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                      }}
                    >
                      G
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {googleUser.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {googleUser.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogout}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary-dark)",
                    fontSize: "13px",
                    fontWeight: 600,
                    width: "100%",
                  }}
                >
                  Ngắt kết nối tài khoản Google
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                    marginBottom: "4px",
                  }}
                >
                  Đăng nhập tài khoản Google Drive để tự động đồng bộ hóa hình
                  ảnh kỉ niệm và sao lưu khôi phục dữ liệu lên đám mây cá nhân.
                </p>
                <button
                  onClick={handleGoogleLogin}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 6px -1px rgba(85, 150, 224, 0.2)",
                  }}
                >
                  <IoLogoGoogle size={16} />
                  <span>Đăng nhập Google</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: Cloud Backups */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <IoCloudDoneOutline size={18} color="var(--primary)" />
              <span>Sao lưu đám mây</span>
            </h3>

            <button
              onClick={handleBackupNow}
              disabled={!googleConnected}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary-dark)",
                fontSize: "13px",
                fontWeight: 600,
                opacity: googleConnected ? 1 : 0.5,
                cursor: googleConnected ? "pointer" : "not-allowed",
              }}
            >
              Sao lưu lên Drive
            </button>
          </div>

          {/* SECTION 5: Dating Statistics Link */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Thống kê Hẹn hò 📊</span>
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginBottom: "14px",
              }}
            >
              Xem tần suất gặp mặt, phân tích các loại hoạt động và chi tiết
              danh sách kỷ niệm của hai bạn.
            </p>
            <button
              onClick={() => setShowStats(true)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary-dark)",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Xem báo cáo Thống kê
            </button>
          </div>

          {/* SECTION: Website Background */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <IoImageOutline size={18} color="var(--primary)" />
              <span>Hình nền Website 🖼️</span>
            </h3>

            {/* Current Background Preview if exists */}
            {backgroundImage ? (
              <div style={{ marginBottom: "14px" }}>
                <div
                  style={{
                    position: "relative",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    width: "100%",
                    height: "120px",
                  }}
                >
                  <img
                    src={backgroundImage}
                    referrerPolicy="no-referrer"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    alt="Background Preview"
                  />
                </div>
                <button
                  onClick={handleDeleteBackground}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--danger)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginTop: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Xóa hình nền
                </button>
              </div>
            ) : (
              <div
                style={{
                  height: "80px",
                  border: "2px dashed var(--border)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "14px",
                }}
              >
                🌸 Chưa cài đặt hình nền
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!googleConnected || loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor:
                  googleConnected && !loading
                    ? "var(--primary)"
                    : "var(--border)",
                color:
                  googleConnected && !loading ? "#ffffff" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: googleConnected && !loading ? "pointer" : "not-allowed",
              }}
            >
              {backgroundImage ? "Thay đổi hình nền" : "Tải lên hình nền mới"}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleUploadBackground}
            />
          </div>
        </div>

        {/* Right Column: Dating Activity Types Manager */}
        <div>
          {/* SECTION 3: Dating Activity Types Manager */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IoListOutline size={18} color="var(--primary)" />
                <span>Loại hoạt động hẹn hò</span>
              </h3>

              <button
                onClick={handleOpenAddType}
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary-dark)",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <IoAddOutline size={14} />
                <span>Thêm mới</span>
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {types.map((type) => (
                <div
                  key={type.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "var(--background)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>
                    {type.name}
                  </span>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleOpenEditType(type)}
                      style={{ color: "var(--primary-dark)", padding: "2px" }}
                    >
                      <IoCreateOutline size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteType(type.id)}
                      style={{ color: "var(--danger)", padding: "2px" }}
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog overlay for Category Add/Edit Prompt */}
      {showTypeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 960,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "320px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              border: "1px solid var(--border)",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              animation: "fadeIn 0.2s",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "var(--font-display)",
              }}
            >
              {editingType
                ? "Chỉnh sửa tên loại hình ✏️"
                : "Thêm loại hình hoạt động mới ➕"}
            </h3>

            <form
              onSubmit={handleSaveType}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <input
                type="text"
                placeholder="VD: Đi trà sữa 🥤"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                autoFocus
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  fontSize: "13.5px",
                }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary-dark)",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
