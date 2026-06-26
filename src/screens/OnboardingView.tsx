import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { AsyncStorageService, type DateUser } from "../services/AsyncStorageService";

const createEmptyUser = (id: string, gender: "Nam" | "Nữ"): DateUser => ({
  id,
  name: "",
  phone: "",
  facebook: "",
  tiktok: "",
  interest: [],
  dislike: [],
  hate: [],
  height: 0,
  weight: 0,
  birthday: "",
  gender,
  shoeSize: "",
  shirtSize: "",
});

export const OnboardingView: React.FC = () => {
  const { refreshState } = useApp();
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // User states
  const [user1, setUser1] = useState<DateUser>(createEmptyUser("user_1", "Nam"));
  const [user2, setUser2] = useState<DateUser>(createEmptyUser("user_2", "Nữ"));

  // Comma separated string states for inputs
  const [interestStr1, setInterestStr1] = useState("");
  const [dislikeStr1, setDislikeStr1] = useState("");
  const [hateStr1, setHateStr1] = useState("");

  const [interestStr2, setInterestStr2] = useState("");
  const [dislikeStr2, setDislikeStr2] = useState("");
  const [hateStr2, setHateStr2] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUser = (user: DateUser): boolean => {
    const newErrors: Record<string, string> = {};

    if (!user.phone.trim()) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    }
    if (!user.birthday.trim()) {
      newErrors.birthday = "Ngày sinh là bắt buộc";
    }
    
    const heightNum = Number(user.height);
    if (!user.height || isNaN(heightNum) || heightNum <= 0) {
      newErrors.height = "Chiều cao phải là số dương";
    }

    const weightNum = Number(user.weight);
    if (!user.weight || isNaN(weightNum) || weightNum <= 0) {
      newErrors.weight = "Cân nặng phải là số dương";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const parsedUser1 = {
      ...user1,
      name: user1.name.trim() || "Bạn Nam",
      interest: interestStr1.split(",").map(i => i.trim()).filter(Boolean),
      dislike: dislikeStr1.split(",").map(i => i.trim()).filter(Boolean),
      hate: hateStr1.split(",").map(i => i.trim()).filter(Boolean),
      height: Number(user1.height),
      weight: Number(user1.weight),
    };
    setUser1(parsedUser1);

    if (validateUser(parsedUser1)) {
      setErrors({});
      setActiveStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setActiveStep(1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep === 1) {
      handleNext();
      return;
    }

    const parsedUser2 = {
      ...user2,
      name: user2.name.trim() || "Bạn Nữ",
      interest: interestStr2.split(",").map(i => i.trim()).filter(Boolean),
      dislike: dislikeStr2.split(",").map(i => i.trim()).filter(Boolean),
      hate: hateStr2.split(",").map(i => i.trim()).filter(Boolean),
      height: Number(user2.height),
      weight: Number(user2.weight),
    };
    setUser2(parsedUser2);

    if (validateUser(parsedUser2)) {
      try {
        setErrors({});
        setLoading(true);
        // Save both users securely to Firebase RTDB
        await AsyncStorageService.saveUsers(user1, parsedUser2);
        // Refresh context to load profiles
        await refreshState();
      } catch (error) {
        console.error("Save onboarding profiles failed:", error);
        setErrors({ submit: "Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại." });
      } finally {
        setLoading(false);
      }
    }
  };

  const updateField = (step: number, field: keyof DateUser, value: any) => {
    if (step === 1) {
      setUser1(prev => ({ ...prev, [field]: value }));
    } else {
      setUser2(prev => ({ ...prev, [field]: value }));
    }
    // Clear error
    if (errors[field as string]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
    }
  };

  const isBoyStep = activeStep === 1;
  const currentThemeColor = isBoyStep ? "var(--primary)" : "var(--accent)";
  const currentBgColor = isBoyStep ? "rgba(85, 150, 224, 0.08)" : "rgba(243, 104, 224, 0.08)";

  return (
    <div className="container animate-fade" style={{ paddingBottom: "40px", maxWidth: "600px", margin: "40px auto" }}>
      {/* Welcome Banner */}
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <h1 
          style={{ 
            fontFamily: "var(--font-display)", 
            fontWeight: 800, 
            fontSize: "26px", 
            color: "var(--text)",
            background: "linear-gradient(45deg, var(--primary) 20%, var(--accent) 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "8px"
          }}
        >
          Two Hearts 💖
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", padding: "0 10px" }}>
          Chào mừng các bạn đến với nhật ký tình yêu. Hãy thiết lập hồ sơ của cả hai để bắt đầu lưu trữ kỷ niệm!
        </p>
      </div>

      {/* Steps Progress Indicator */}
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          marginBottom: "32px",
          padding: "0 24px",
          position: "relative"
        }}
      >
        <div 
          style={{ 
            position: "absolute", 
            top: "50%", 
            left: "24px", 
            right: "24px", 
            height: "4px", 
            backgroundColor: "var(--border)", 
            zIndex: 1, 
            transform: "translateY(-50%)" 
          }}
        >
          <div 
            style={{ 
              width: isBoyStep ? "0%" : "100%", 
              height: "100%", 
              backgroundColor: "var(--accent)", 
              transition: "width 0.4s ease" 
            }}
          />
        </div>

        {/* Step 1 Node */}
        <div 
          style={{ 
            zIndex: 2, 
            width: "36px", 
            height: "36px", 
            borderRadius: "50%", 
            backgroundColor: isBoyStep ? "var(--primary)" : "var(--primary-light)", 
            color: isBoyStep ? "#ffffff" : "var(--primary)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "14px",
            border: `2px solid ${isBoyStep ? "var(--primary)" : "var(--primary-dark)"}`,
            transition: "all 0.3s ease"
          }}
        >
          1
        </div>

        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", zIndex: 2, backgroundColor: "var(--background)", padding: "0 8px" }}>
          {isBoyStep ? "Thiết lập bạn Nam ♂️" : "Thiết lập bạn Nữ ♀️"}
        </span>

        {/* Step 2 Node */}
        <div 
          style={{ 
            zIndex: 2, 
            width: "36px", 
            height: "36px", 
            borderRadius: "50%", 
            backgroundColor: !isBoyStep ? "var(--accent)" : "var(--surface)", 
            color: !isBoyStep ? "#ffffff" : "var(--text-muted)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "14px",
            border: `2px solid ${!isBoyStep ? "var(--accent)" : "var(--border)"}`,
            transition: "all 0.3s ease"
          }}
        >
          2
        </div>
      </div>

      {/* Main Profile Form Card */}
      <form 
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          border: `1px solid var(--border)`,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          transition: "all 0.4s ease"
        }}
      >
        <div 
          style={{ 
            fontSize: "16px", 
            fontWeight: 700, 
            color: currentThemeColor,
            fontFamily: "var(--font-display)",
            paddingBottom: "8px",
            borderBottom: `2px solid ${currentBgColor}`,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {isBoyStep ? "👦 Thông tin Bạn Nam (Mặc định)" : "👧 Thông tin Bạn Nữ"}
        </div>

        {/* Name input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Họ và tên</label>
          <input
            type="text"
            placeholder={isBoyStep ? "Nhập tên bạn Nam (VD: Bạn Nam)" : "Nhập tên bạn Nữ (VD: Bạn Nữ)"}
            value={isBoyStep ? user1.name : user2.name}
            onChange={(e) => updateField(activeStep, "name", e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--border)`,
              fontSize: "14px",
              transition: "border-color var(--transition-fast)"
            }}
            onFocus={(e) => e.target.style.borderColor = currentThemeColor}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Phone input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
            Số điện thoại <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="tel"
            placeholder="Nhập số điện thoại"
            value={isBoyStep ? user1.phone : user2.phone}
            onChange={(e) => updateField(activeStep, "phone", e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${errors.phone ? "var(--danger)" : "var(--border)"}`,
              fontSize: "14px",
            }}
            onFocus={(e) => e.target.style.borderColor = errors.phone ? "var(--danger)" : currentThemeColor}
            onBlur={(e) => e.target.style.borderColor = errors.phone ? "var(--danger)" : "var(--border)"}
          />
          {errors.phone && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.phone}</span>}
        </div>

        {/* Birthday input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
            Ngày sinh <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="date"
            value={isBoyStep ? user1.birthday : user2.birthday}
            onChange={(e) => updateField(activeStep, "birthday", e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${errors.birthday ? "var(--danger)" : "var(--border)"}`,
              fontSize: "14px",
              color: isBoyStep && !user1.birthday || !isBoyStep && !user2.birthday ? "var(--text-muted)" : "var(--text)"
            }}
            onFocus={(e) => e.target.style.borderColor = errors.birthday ? "var(--danger)" : currentThemeColor}
            onBlur={(e) => e.target.style.borderColor = errors.birthday ? "var(--danger)" : "var(--border)"}
          />
          {errors.birthday && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.birthday}</span>}
        </div>

        {/* Height and Weight group */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
              Chiều cao (cm) <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="number"
              placeholder="VD: 175"
              value={isBoyStep ? (user1.height || "") : (user2.height || "")}
              onChange={(e) => updateField(activeStep, "height", e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${errors.height ? "var(--danger)" : "var(--border)"}`,
                fontSize: "14px",
              }}
              onFocus={(e) => e.target.style.borderColor = errors.height ? "var(--danger)" : currentThemeColor}
              onBlur={(e) => e.target.style.borderColor = errors.height ? "var(--danger)" : "var(--border)"}
            />
            {errors.height && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.height}</span>}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
              Cân nặng (kg) <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="number"
              placeholder="VD: 65"
              value={isBoyStep ? (user1.weight || "") : (user2.weight || "")}
              onChange={(e) => updateField(activeStep, "weight", e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${errors.weight ? "var(--danger)" : "var(--border)"}`,
                fontSize: "14px",
              }}
              onFocus={(e) => e.target.style.borderColor = errors.weight ? "var(--danger)" : currentThemeColor}
              onBlur={(e) => e.target.style.borderColor = errors.weight ? "var(--danger)" : "var(--border)"}
            />
            {errors.weight && <span style={{ fontSize: "11px", color: "var(--danger)" }}>{errors.weight}</span>}
          </div>
        </div>

        {/* Sizes Group */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Size giày (Không bắt buộc)</label>
            <input
              type="text"
              placeholder="VD: 41"
              value={isBoyStep ? user1.shoeSize : user2.shoeSize}
              onChange={(e) => updateField(activeStep, "shoeSize", e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid var(--border)`,
                fontSize: "14px",
              }}
              onFocus={(e) => e.target.style.borderColor = currentThemeColor}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Size áo (Không bắt buộc)</label>
            <input
              type="text"
              placeholder="VD: L, XL"
              value={isBoyStep ? user1.shirtSize : user2.shirtSize}
              onChange={(e) => updateField(activeStep, "shirtSize", e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid var(--border)`,
                fontSize: "14px",
              }}
              onFocus={(e) => e.target.style.borderColor = currentThemeColor}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>
        </div>

        {/* Social URLs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Link Facebook (Không bắt buộc)</label>
          <input
            type="url"
            placeholder="https://facebook.com/..."
            value={isBoyStep ? user1.facebook : user2.facebook}
            onChange={(e) => updateField(activeStep, "facebook", e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--border)`,
              fontSize: "14px",
            }}
            onFocus={(e) => e.target.style.borderColor = currentThemeColor}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Link TikTok (Không bắt buộc)</label>
          <input
            type="url"
            placeholder="https://tiktok.com/@..."
            value={isBoyStep ? user1.tiktok : user2.tiktok}
            onChange={(e) => updateField(activeStep, "tiktok", e.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--border)`,
              fontSize: "14px",
            }}
            onFocus={(e) => e.target.style.borderColor = currentThemeColor}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Arrays input: comma-separated */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Sở thích (Phân tách bằng dấu phẩy)</label>
          <textarea
            placeholder="VD: Cà phê, Du lịch, Xem phim"
            value={isBoyStep ? interestStr1 : interestStr2}
            onChange={(e) => isBoyStep ? setInterestStr1(e.target.value) : setInterestStr2(e.target.value)}
            rows={2}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--border)`,
              fontSize: "14px",
              resize: "none",
              lineHeight: 1.4
            }}
            onFocus={(e) => e.target.style.borderColor = currentThemeColor}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Ghét / Không thích (Phân tách bằng dấu phẩy)</label>
          <textarea
            placeholder="VD: Ăn hành, Thức khuya, Trễ giờ"
            value={isBoyStep ? dislikeStr1 : dislikeStr2}
            onChange={(e) => isBoyStep ? setDislikeStr1(e.target.value) : setDislikeStr2(e.target.value)}
            rows={2}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--border)`,
              fontSize: "14px",
              resize: "none",
              lineHeight: 1.4
            }}
            onFocus={(e) => e.target.style.borderColor = currentThemeColor}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Cực kỳ ghét / Dị ứng (Phân tách bằng dấu phẩy)</label>
          <textarea
            placeholder="VD: Sầu riêng, Thủy hải sản, Nói dối"
            value={isBoyStep ? hateStr1 : hateStr2}
            onChange={(e) => isBoyStep ? setHateStr1(e.target.value) : setHateStr2(e.target.value)}
            rows={2}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--border)`,
              fontSize: "14px",
              resize: "none",
              lineHeight: 1.4
            }}
            onFocus={(e) => e.target.style.borderColor = currentThemeColor}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {errors.submit && (
          <span style={{ fontSize: "12px", color: "var(--danger)", textAlign: "center" }}>
            {errors.submit}
          </span>
        )}

        {/* Buttons Action */}
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          {!isBoyStep && (
            <button
              type="button"
              onClick={handleBack}
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
              Quay lại
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 2,
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: currentThemeColor,
              color: "#ffffff",
              boxShadow: `0 4px 6px -1px ${isBoyStep ? "rgba(85,150,224,0.2)" : "rgba(243,104,224,0.2)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {loading ? (
              <span className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px", borderLeftColor: "#ffffff", margin: 0 }}></span>
            ) : isBoyStep ? (
              "Tiếp tục"
            ) : (
              "Hoàn thành thiết lập"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
