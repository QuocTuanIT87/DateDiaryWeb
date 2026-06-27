import React, { useState, useEffect } from "react";
import { SecureStorage } from "../utils/encryption";
import { IoLockClosedOutline, IoKeyOutline } from "react-icons/io5";

// Security storage keys
const AUTH_DATE_KEY = "@fireheart_security_passed";
const LOCK_UNTIL_KEY = "@fireheart_security_lock";

interface SecurityGateProps {
  onPassed: () => void;
}

// Color lists
const BLUE_COLOR = "#0000FF";
const GREEN_COLOR = "#008000";

const Q1_DISTRACTORS = [
  "#FF0000", // Red
  "#FFFF00", // Yellow
  "#FFA500", // Orange
  "#800080", // Purple
  "#000000", // Black
];

const Q2_DISTRACTORS = [
  "#FF0000", // Red
  "#FFFF00", // Yellow
  "#FFA500", // Orange
  "#800080", // Purple
  "#000000", // Black
  "#0000FF", // Blue
  "#FFC0CB", // Pink
  "#A52A2A", // Brown
  "#808080", // Grey
  "#FFFFFF", // White
  "#00FFFF", // Cyan
  "#FF00FF", // Magenta
  "#FFD700", // Gold
  "#4B0082", // Indigo
];

// Helper to shuffle array
const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Helper for today's date string YYYY-MM-DD
const getTodayString = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to calculate expected password
const calculatePassword = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  const dateString = `${day}${month}${year}`;
  let sum = 0;
  for (let char of dateString) {
    const val = parseInt(char, 10);
    if (!isNaN(val)) {
      sum += val;
    }
  }
  return `${sum}87`;
};

export const SecurityGate: React.FC<SecurityGateProps> = ({ onPassed }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lockUntil, setLockUntil] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [attemptsQ1, setAttemptsQ1] = useState<number>(0);
  const [attemptsQ3, setAttemptsQ3] = useState<number>(0);
  const [passwordInput, setPasswordInput] = useState<string>("");

  // Grid options (shuffled once on component mount)
  const [q1Colors, setQ1Colors] = useState<string[]>([]);
  const [q2Colors, setQ2Colors] = useState<string[]>([]);

  // 1. Initial State Load & Check Locks
  useEffect(() => {
    // Check if locked
    const decryptedLock = SecureStorage.getItem(LOCK_UNTIL_KEY);
    if (decryptedLock) {
      const lockTimestamp = parseInt(decryptedLock, 10);
      if (!isNaN(lockTimestamp) && lockTimestamp > Date.now()) {
        setLockUntil(lockTimestamp);
        setTimeLeft(Math.ceil((lockTimestamp - Date.now()) / 1000));
      } else {
        SecureStorage.removeItem(LOCK_UNTIL_KEY);
      }
    }

    setStep(1);
    setAttemptsQ1(0);
    setAttemptsQ3(0);

    // Initialize colors
    setQ1Colors(shuffle([BLUE_COLOR, ...Q1_DISTRACTORS]));
    setQ2Colors(shuffle([GREEN_COLOR, ...Q2_DISTRACTORS]));
  }, []);

  // 2. Lockout Countdown Timer
  useEffect(() => {
    if (lockUntil <= 0) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        setLockUntil(0);
        setTimeLeft(0);
        setAttemptsQ1(0);
        setAttemptsQ3(0);
        setStep(1);
        SecureStorage.removeItem(LOCK_UNTIL_KEY);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  // 3. Lock helper
  const activateLock = (durationMinutes: number) => {
    const unlockTime = Date.now() + durationMinutes * 60 * 1000;
    setLockUntil(unlockTime);
    setTimeLeft(durationMinutes * 60);
    setStep(1); // Always reset to Q1 upon lock trigger
    SecureStorage.setItem(LOCK_UNTIL_KEY, unlockTime.toString());
  };

  // 4. Handle Q1 selection
  const handleQ1Select = (color: string) => {
    if (color === BLUE_COLOR) {
      setStep(2);
    } else {
      const nextAttempts = attemptsQ1 + 1;
      setAttemptsQ1(nextAttempts);
      if (nextAttempts >= 2) {
        activateLock(10);
      }
    }
  };

  // 5. Handle Q2 selection
  const handleQ2Select = (color: string) => {
    if (color === GREEN_COLOR) {
      setStep(3);
    } else {
      activateLock(15);
    }
  };

  // 6. Handle Q3 submission
  const handleQ3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = calculatePassword();
    if (passwordInput.trim() === correctPassword) {
      // Save authenticated date (encrypted)
      SecureStorage.setItem(AUTH_DATE_KEY, getTodayString());
      onPassed();
    } else {
      setPasswordInput("");
      const nextAttempts = attemptsQ3 + 1;
      setAttemptsQ3(nextAttempts);
      if (nextAttempts >= 3) {
        activateLock(30);
      }
    }
  };

  // Format countdown text MM:SS
  const formatTimeLeft = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Render Lockout Screen
  if (lockUntil > Date.now()) {
    return (
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #ffeef8 0%, #eef6ff 100%)",
          padding: "20px"
        }}
      >
        <div 
          style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            textAlign: "center",
            boxShadow: "0 20px 40px -15px rgba(85, 150, 224, 0.15)"
          }}
        >
          <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--danger)", marginBottom: "20px" }}>
            <IoLockClosedOutline size={40} />
          </div>
          
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", color: "var(--text)", marginBottom: "8px" }}>
            Tạm thời khóa truy cập 🔒
          </h2>
          
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "24px" }}>
            Nhập sai câu hỏi bảo mật quá số lần quy định.
          </p>

          <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "monospace", color: "var(--danger)", letterSpacing: "1px", marginBottom: "10px" }}>
            {formatTimeLeft()}
          </div>
          
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Ứng dụng sẽ tự động mở khóa sau khi đồng hồ về 00:00
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffeef8 0%, #eef6ff 100%)",
        padding: "20px"
      }}
    >
      <div 
        style={{
          maxWidth: "400px",
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          boxShadow: "0 20px 40px -15px rgba(85, 150, 224, 0.15)"
        }}
      >
        {/* Header brand logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }} className="animate-heartbeat">💖</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "var(--text)" }}>
            Xác minh Bảo mật
          </h2>
          <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
            Bảo vệ nhật ký cá nhân của hai người
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "24px" }}>
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: step === s ? "var(--primary)" : step > s ? "var(--success)" : "var(--border)",
                transition: "background-color 0.3s"
              }}
            />
          ))}
        </div>

        {/* Step 1: 6 colors (Select Blue - No text hint) */}
        {step === 1 && (
          <div style={{ textAlign: "center" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>
              Câu 1: Chọn màu sắc chính xác
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {q1Colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleQ1Select(color)}
                  style={{
                    backgroundColor: color,
                    height: "80px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid #ffffff",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    transition: "transform 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 15 colors (Select Green - No text hint) */}
        {step === 2 && (
          <div style={{ textAlign: "center" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>
              Câu 2: Chọn màu sắc chính xác
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {q2Colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleQ2Select(color)}
                  style={{
                    backgroundColor: color,
                    height: "50px",
                    borderRadius: "var(--radius-sm)",
                    border: "2px solid #ffffff",
                    boxShadow: "0 3px 5px -1px rgba(0,0,0,0.05)",
                    transition: "transform 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Password input (No formula text hint) */}
        {step === 3 && (
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", textAlign: "center", marginBottom: "20px" }}>
              Câu 3: Nhập mật khẩu bảo mật
            </h4>

            <form onSubmit={handleQ3Submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    paddingLeft: "36px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "13.5px",
                    backgroundColor: "#ffffff"
                  }}
                />
                <IoKeyOutline 
                  size={16} 
                  style={{ 
                    position: "absolute", 
                    top: "14px", 
                    left: "12px", 
                    color: "var(--text-muted)" 
                  }} 
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  boxShadow: "0 4px 6px -1px rgba(85, 150, 224, 0.2)"
                }}
              >
                Xác nhận truy cập
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
