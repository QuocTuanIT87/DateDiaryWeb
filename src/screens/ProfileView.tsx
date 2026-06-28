import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import {
  AsyncStorageService,
  type DateStartTime,
} from "../services/AsyncStorageService";
import { GoogleDriveService } from "../services/GoogleDriveService";
import {
  getDurationSince,
  formatDateOnly,
  formatDateTime,
  type DurationDetails,
} from "../utils/dateUtils";
import { LazyImage } from "../components/LazyImage";
import { CustomAlert } from "../components/CustomAlert";
import {
  IoHeart,
  IoCalendarOutline,
  IoCallOutline,
  IoLogoFacebook,
  IoCreateOutline,
  IoGiftOutline,
  IoBodyOutline,
  IoCameraOutline,
} from "react-icons/io5";

interface ProfileViewProps {
  onEditProfile: (userId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onEditProfile }) => {
  const { users, refreshState } = useApp();
  const [milestones, setMilestones] = useState<DateStartTime | null>(null);
  const [duration, setDuration] = useState<DurationDetails>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [activeGender, setActiveGender] = useState<"Nam" | "Nữ" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const startTime = AsyncStorageService.getStartTime();
      setMilestones(startTime);

      // Calculate initial duration
      if (startTime && startTime.acquaintedDay) {
        setDuration(getDurationSince(startTime.acquaintedDay));
      }
    } catch (error) {
      console.error("Load profiles failed:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [users]);

  // Live anniversary counter ticking
  useEffect(() => {
    if (!milestones || !milestones.acquaintedDay) return;

    const interval = setInterval(() => {
      setDuration(getDurationSince(milestones.acquaintedDay));
    }, 1000);

    return () => clearInterval(interval);
  }, [milestones]);

  const handleAvatarClick = async (gender: "Nam" | "Nữ") => {
    const connected = await GoogleDriveService.isLoggedIn();
    if (!connected) {
      CustomAlert.alert(
        "Chưa kết nối Google",
        "Ảnh hồ sơ cần được lưu trên Google Drive. Vui lòng kết nối tài khoản Google trong phần Cài đặt trước.",
      );
      return;
    }

    setActiveGender(gender);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && activeGender) {
      const file = e.target.files[0];
      const localUri = URL.createObjectURL(file);
      const gender = activeGender;
      setActiveGender(null);

      try {
        setUpdatingAvatar(true);
        // Upload new avatar to Google Drive
        const driveUrl = await GoogleDriveService.uploadAvatar(
          localUri,
          gender,
        );

        // Update database
        const userList = await AsyncStorageService.getUsers();
        const boyUser = userList.find((u) => u.gender === "Nam");
        const girlUser = userList.find((u) => u.gender === "Nữ");

        if (gender === "Nam" && boyUser) {
          boyUser.avatar = driveUrl;
        } else if (gender === "Nữ" && girlUser) {
          girlUser.avatar = driveUrl;
        }

        if (boyUser && girlUser) {
          await AsyncStorageService.saveUsers(boyUser, girlUser);
        }

        // Reload data
        await refreshState();
        CustomAlert.success("Thành công", "Đã cập nhật ảnh đại diện của bạn.");
      } catch (error: any) {
        console.error("Update avatar error:", error);
        CustomAlert.alert(
          "Lỗi",
          error.message || "Không thể cập nhật ảnh đại diện.",
        );
      } finally {
        setUpdatingAvatar(false);
        // Clear input value so same file can trigger change again
        e.target.value = "";
      }
    }
  };

  const boyUser = users.find((u) => u.gender === "Nam");
  const girlUser = users.find((u) => u.gender === "Nữ");

  // Default avatars if not set
  const defaultBoyAvatar =
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150";
  const defaultGirlAvatar =
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150";

  return (
    <div
      className="container animate-fade"
      style={{ paddingBottom: "40px", flex: 1 }}
    >
      {/* Input hidden file */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontFamily: "'RobotoSlab', serif",
            fontWeight: 500,
            fontSize: "20px",
            color: "var(--text)",
          }}
        >
          Chúng mình 💕
        </h2>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "4px",
            fontFamily: "'PlaywriteAUTAS', cursive",
            lineHeight: 1.6,
            letterSpacing: "0.5px",
          }}
        >
          Nơi lưu giữ thông tin chi tiết và đồng hồ tình yêu
        </p>
      </div>

      <div
        className="profile-handwriting-section"
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        {/* Ticking Anniversary Clock */}
        <div
          style={{
            background: "linear-gradient(135deg, #f78fb3 0%, #f368e0 100%)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 16px",
            color: "#ffffff",
            textAlign: "center",
            boxShadow: "0 10px 20px -5px rgba(243, 104, 224, 0.3)",
            position: "relative",
            overflow: "hidden",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Pulsing overlay heart */}
          <div
            className="animate-heartbeat"
            style={{
              position: "absolute",
              fontSize: "140px",
              color: "rgba(255, 255, 255, 0.08)",
              top: "calc(50% - 70px)",
              left: "calc(50% - 70px)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            <IoHeart />
          </div>

          <div style={{ zIndex: 2 }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "1px",
                opacity: 0.9,
              }}
            >
              Thời gian bên nhau
            </h4>

            {/* Days Counter */}
            <div
              style={{
                margin: "14px 0",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
              }}
            >
              <span
                className="days-counter-number"
                style={{
                  fontSize: "56px",
                  fontWeight: 800,
                  fontFamily: "'BitcountSingle', sans-serif",
                }}
              >
                {duration.days}
              </span>
              <span
                style={{ fontSize: "22px", fontWeight: 600, marginLeft: "4px" }}
              >
                ngày
              </span>
            </div>

            {/* Clock timer hours, minutes, seconds */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                fontSize: "17px",
                fontWeight: 500,
                backgroundColor: "rgba(255,255,255,0.15)",
                padding: "6px 16px",
                borderRadius: "var(--radius-full)",
              }}
            >
              <span>{String(duration.hours).padStart(2, "0")} Giờ</span>
              <span>•</span>
              <span>{String(duration.minutes).padStart(2, "0")} Phút</span>
              <span>•</span>
              <span>{String(duration.seconds).padStart(2, "0")} Giây</span>
            </div>

            {/* Date Milestones Details */}
            {milestones && (
              <div
                style={{
                  marginTop: "16px",
                  fontSize: "14px",
                  opacity: 0.8,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div>
                  🗓️ Ngày tỏ tình: {formatDateTime(milestones.confessionDay)}
                </div>
                <div>
                  🤝 Ngày quen nhau: {formatDateTime(milestones.acquaintedDay)}
                </div>
              </div>
            )}
          </div>
        </div>

        {updatingAvatar && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "10px",
              marginBottom: "10px",
              color: "var(--accent)",
            }}
          >
            <div
              className="spinner"
              style={{
                width: "20px",
                height: "20px",
                borderWidth: "2px",
                borderLeftColor: "var(--accent)",
              }}
            ></div>
            <span style={{ fontSize: "16px", fontWeight: 500 }}>
              Đang cập nhật ảnh hồ sơ...
            </span>
          </div>
        )}

        {/* Side by side profiles */}
        <div className="two-col-grid">
          {[boyUser, girlUser].map((user) => {
            if (!user) return null;
            const isBoy = user.gender === "Nam";
            const themeColor = isBoy ? "var(--accent)" : "var(--primary)";
            const fallbackAvatar = isBoy ? defaultBoyAvatar : defaultGirlAvatar;

            return (
              <div
                key={user.id}
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Header profile info */}
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  {/* Avatar Box with click to edit */}
                  <div
                    onClick={() => handleAvatarClick(user.gender)}
                    className="profile-avatar-container"
                    style={{
                      position: "relative",
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      overflow: "hidden",
                      border: `2px solid ${themeColor}`,
                    }}
                  >
                    <LazyImage
                      src={
                        GoogleDriveService.resolveDriveUrl(user.avatar) ||
                        fallbackAvatar
                      }
                      alt={user.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div className="avatar-hover-overlay">
                      <IoCameraOutline size={26} color="#ffffff" />
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {user.name}
                      </h3>
                      <span style={{ fontSize: "16px" }}>
                        {isBoy ? "♂️" : "♀️"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "15px",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      <IoCalendarOutline size={13} />
                      <span>Sinh nhật: {formatDateOnly(user.birthday)}</span>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEditProfile(user.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--background)",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "15px",
                    }}
                  >
                    <IoCreateOutline size={14} />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Physical Details */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    backgroundColor: "var(--background)",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <IoBodyOutline size={15} color={themeColor} />
                    <span>
                      <strong>Cơ thể:</strong> {user.height}cm / {user.weight}kg
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <IoGiftOutline size={15} color={themeColor} />
                    <span>
                      <strong>Size:</strong> Giày {user.shoeSize || "?"} / Áo{" "}
                      {user.shirtSize || "?"}
                    </span>
                  </div>

                  {user.phone && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        gridColumn: "span 2",
                      }}
                    >
                      <IoCallOutline size={14} color={themeColor} />
                      <span>
                        <strong>SĐT:</strong> {user.phone}
                      </span>
                    </div>
                  )}

                  {user.facebook && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        gridColumn: "span 2",
                      }}
                    >
                      <IoLogoFacebook size={14} color="#1877f2" />
                      <a
                        href={user.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--primary-dark)",
                          textDecoration: "none",
                        }}
                      >
                        Kết nối Facebook
                      </a>
                    </div>
                  )}
                </div>

                {/* Arrays hobbies lists */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "16px",
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--success)" }}>
                      🟢 Sở thích:
                    </strong>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                        marginTop: "4px",
                      }}
                    >
                      {user.interest && user.interest.length > 0 ? (
                        user.interest.map((h, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: "#e8f5e9",
                              color: "#2e7d32",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {h}
                          </span>
                        ))
                      ) : (
                        <span
                          style={{
                            fontSize: "15px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Chưa cập nhật
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong style={{ color: "var(--warning)" }}>
                      🟡 Không thích:
                    </strong>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                        marginTop: "4px",
                      }}
                    >
                      {user.dislike && user.dislike.length > 0 ? (
                        user.dislike.map((d, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: "#fff8e1",
                              color: "#b78103",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {d}
                          </span>
                        ))
                      ) : (
                        <span
                          style={{
                            fontSize: "15px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Chưa cập nhật
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong style={{ color: "var(--danger)" }}>
                      🔴 Cực kỳ ghét:
                    </strong>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                        marginTop: "4px",
                      }}
                    >
                      {user.hate && user.hate.length > 0 ? (
                        user.hate.map((ht, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: "#ffebee",
                              color: "#c62828",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {ht}
                          </span>
                        ))
                      ) : (
                        <span
                          style={{
                            fontSize: "15px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Chưa cập nhật
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
