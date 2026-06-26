import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { AsyncStorageService, type DateUser } from "../services/AsyncStorageService";
import { CustomAlert } from "../components/CustomAlert";
import { IoArrowBackOutline } from "react-icons/io5";

interface EditProfileViewProps {
  userId: string;
  onBack: () => void;
}

export const EditProfileView: React.FC<EditProfileViewProps> = ({ userId, onBack }) => {
  const { refreshState } = useApp();
  const [user, setUser] = useState<DateUser | null>(null);
  const [allUsers, setAllUsers] = useState<DateUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [interestStr, setInterestStr] = useState("");
  const [dislikeStr, setDislikeStr] = useState("");
  const [hateStr, setHateStr] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const usersList = await AsyncStorageService.getUsers();
        setAllUsers(usersList);
        const targetUser = usersList.find(u => u.id === userId);
        if (targetUser) {
          setUser(targetUser);
          setName(targetUser.name);
          setPhone(targetUser.phone);
          setBirthday(targetUser.birthday);
          setHeight(String(targetUser.height));
          setWeight(String(targetUser.weight));
          setFacebook(targetUser.facebook || "");
          setTiktok(targetUser.tiktok || "");
          setShoeSize(targetUser.shoeSize || "");
          setShirtSize(targetUser.shirtSize || "");
          setInterestStr(targetUser.interest ? targetUser.interest.join(", ") : "");
          setDislikeStr(targetUser.dislike ? targetUser.dislike.join(", ") : "");
          setHateStr(targetUser.hate ? targetUser.hate.join(", ") : "");
        } else {
          CustomAlert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
          onBack();
        }
      } catch (error) {
        console.error("Load edit user failed:", error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Họ và tên là bắt buộc";
    }
    if (!phone.trim()) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    }
    if (!birthday.trim()) {
      newErrors.birthday = "Ngày sinh là bắt buộc";
    }
    
    const heightNum = Number(height);
    if (!height || isNaN(heightNum) || heightNum <= 0) {
      newErrors.height = "Chiều cao phải là số dương";
    }

    const weightNum = Number(weight);
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      newErrors.weight = "Cân nặng phải là số dương";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const updatedUser: DateUser = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        birthday: birthday.trim(),
        height: heightNum,
        weight: weightNum,
        facebook: facebook.trim(),
        tiktok: tiktok.trim(),
        shoeSize: shoeSize.trim(),
        shirtSize: shirtSize.trim(),
        interest: interestStr.split(",").map(i => i.trim()).filter(Boolean),
        dislike: dislikeStr.split(",").map(i => i.trim()).filter(Boolean),
        hate: hateStr.split(",").map(i => i.trim()).filter(Boolean),
      };

      const user1 = user.id === "user_1" ? updatedUser : allUsers.find(u => u.id === "user_1")!;
      const user2 = user.id === "user_2" ? updatedUser : allUsers.find(u => u.id === "user_2")!;

      await AsyncStorageService.saveUsers(user1, user2);
      await refreshState();
      CustomAlert.success(
        "Thành công",
        "Đã cập nhật thông tin thành công!",
        [{ text: "OK", onPress: onBack }]
      );
    } catch (error) {
      console.error("Save profile failed:", error);
      CustomAlert.alert("Lỗi", "Không thể lưu chỉnh sửa thông tin.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const isBoy = user?.gender === "Nam";
  const themeColor = isBoy ? "var(--primary)" : "var(--accent)";

  return (
    <div className="container animate-fade" style={{ paddingBottom: "40px" }}>
      {/* Header Bar */}
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          padding: "8px 0",
        }}
      >
        <button 
          onClick={onBack}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text)"
          }}
        >
          <IoArrowBackOutline size={20} />
        </button>
        <h2 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text)" }}>
          Chỉnh sửa thông tin
        </h2>
      </div>

      <form 
        onSubmit={handleSave}
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          border: "1px solid var(--border)",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >
        <div 
          style={{ 
            fontSize: "15px", 
            fontWeight: 700, 
            color: themeColor,
            fontFamily: "var(--font-display)",
            paddingBottom: "8px",
            borderBottom: `2px solid ${isBoy ? "rgba(85, 150, 224, 0.08)" : "rgba(243, 104, 224, 0.08)"}`,
            marginBottom: "4px"
          }}
        >
          {isBoy ? "👦 Bạn Nam" : "👧 Bạn Nữ"}
        </div>

        {/* Name input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Họ và tên</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${errors.name ? "var(--danger)" : "var(--border)"}`,
              fontSize: "14px",
            }}
          />
          {errors.name && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.name}</span>}
        </div>

        {/* Phone input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${errors.phone ? "var(--danger)" : "var(--border)"}`,
              fontSize: "14px",
            }}
          />
          {errors.phone && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.phone}</span>}
        </div>

        {/* Birthday input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Ngày sinh</label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${errors.birthday ? "var(--danger)" : "var(--border)"}`,
              fontSize: "14px",
            }}
          />
          {errors.birthday && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.birthday}</span>}
        </div>

        {/* Height and Weight group */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Chiều cao (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${errors.height ? "var(--danger)" : "var(--border)"}`,
                fontSize: "14px",
              }}
            />
            {errors.height && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.height}</span>}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Cân nặng (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${errors.weight ? "var(--danger)" : "var(--border)"}`,
                fontSize: "14px",
              }}
            />
            {errors.weight && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.weight}</span>}
          </div>
        </div>

        {/* Sizes Group */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Size giày</label>
            <input
              type="text"
              value={shoeSize}
              onChange={(e) => setShoeSize(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Size áo</label>
            <input
              type="text"
              value={shirtSize}
              onChange={(e) => setShirtSize(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        {/* Social Link inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Link Facebook</label>
          <input
            type="url"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Link TikTok</label>
          <input
            type="url"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Commas arrays */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Sở thích (Phân tách bằng dấu phẩy)</label>
          <textarea
            value={interestStr}
            onChange={(e) => setInterestStr(e.target.value)}
            rows={2}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "14px",
              resize: "none",
              lineHeight: 1.4
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Không thích (Phân tách bằng dấu phẩy)</label>
          <textarea
            value={dislikeStr}
            onChange={(e) => setDislikeStr(e.target.value)}
            rows={2}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "14px",
              resize: "none",
              lineHeight: 1.4
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Ghét / Dị ứng (Phân tách bằng dấu phẩy)</label>
          <textarea
            value={hateStr}
            onChange={(e) => setHateStr(e.target.value)}
            rows={2}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "14px",
              resize: "none",
              lineHeight: 1.4
            }}
          />
        </div>

        {/* Buttons Action */}
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-dark)",
            }}
          >
            Hủy bỏ
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 2,
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: themeColor,
              color: "#ffffff",
              boxShadow: `0 4px 6px -1px ${isBoy ? "rgba(85,150,224,0.15)" : "rgba(243,104,224,0.15)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {loading ? (
              <span className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px", borderLeftColor: "#ffffff", margin: 0 }}></span>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
