import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { CustomAlertProvider } from "./components/CustomAlert";
import { OnboardingView } from "./screens/OnboardingView";
import { AddEventView } from "./screens/AddEventView";
import { ProfileView } from "./screens/ProfileView";
import { SettingsView } from "./screens/SettingsView";
import { EditProfileView } from "./screens/EditProfileView";
import { getDurationSince } from "./utils/dateUtils";
import { GoogleDriveService } from "./services/GoogleDriveService";
import { LazyImage } from "./components/LazyImage";
import { decrypt } from "./utils/encryption";
import { SecurityGate } from "./components/SecurityGate";

import { 
  IoJournalOutline, 
  IoJournal,
  IoHeartOutline, 
  IoHeart,
  IoSettingsOutline, 
  IoSettings
} from "react-icons/io5";

type TabType = "diary" | "profile" | "settings";
type SubViewType = null | { type: "edit-profile"; userId: string };

const MainAppContent: React.FC = () => {
  const { users, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("diary");
  const [subView, setSubView] = useState<SubViewType>(null);
  const [daysTogether, setDaysTogether] = useState<number>(0);

  // Security Gate State
  const [isSecured, setIsSecured] = useState<boolean>(() => {
    try {
      const encryptedAuthDate = localStorage.getItem("@fireheart_security_passed");
      const encryptedLock = localStorage.getItem("@fireheart_security_lock");
      
      if (encryptedLock) {
        const decryptedLock = decrypt(encryptedLock);
        const lockTimestamp = parseInt(decryptedLock, 10);
        if (!isNaN(lockTimestamp) && lockTimestamp > Date.now()) {
          return false;
        }
      }

      if (encryptedAuthDate) {
        const decryptedAuthDate = decrypt(encryptedAuthDate);
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const today = `${yyyy}-${mm}-${dd}`;
        return decryptedAuthDate === today;
      }
    } catch (e) {
      console.error("Failed to load security gate state:", e);
    }
    return false;
  });

  // Live anniversary counter in the footer
  useEffect(() => {
    if (!users || users.length < 2) return;
    
    // Calculate days count
    const startTime = { confessionDay: "2026-01-01T21:30:00+07:00" }; // fallback default
    const duration = getDurationSince(startTime.confessionDay);
    setDaysTogether(duration.days);

    const interval = setInterval(() => {
      setDaysTogether(getDurationSince(startTime.confessionDay).days);
    }, 60000);

    return () => clearInterval(interval);
  }, [users]);

  // 1. Loading State Screen
  if (isLoading) {
    return (
      <div 
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "var(--background)",
          gap: "16px"
        }}
      >
        <div style={{ fontSize: "52px", color: "var(--accent)" }} className="animate-heartbeat">
          💖
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  // 1b. Security Challenge Check
  if (!isSecured) {
    return <SecurityGate onPassed={() => setIsSecured(true)} />;
  }

  // 2. Onboarding Flow Redirect
  if (users.length < 2) {
    return <OnboardingView />;
  }

  const boyUser = users.find((u) => u.gender === "Nam");
  const girlUser = users.find((u) => u.gender === "Nữ");
  const defaultBoyAvatar = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150";
  const defaultGirlAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150";

  // 3. Render Tab Content
  const renderTabContent = () => {
    if (subView && subView.type === "edit-profile") {
      return (
        <EditProfileView 
          userId={subView.userId} 
          onBack={() => setSubView(null)} 
        />
      );
    }

    switch (activeTab) {
      case "profile":
        return (
          <ProfileView 
            onEditProfile={(userId) => setSubView({ type: "edit-profile", userId })} 
          />
        );
      case "settings":
        return <SettingsView />;
      case "diary":
      default:
        return <AddEventView />;
    }
  };

  return (
    <div className="main-wrapper">
      {/* DESKTOP SIDEBAR PANEL */}
      <div className="desktop-sidebar">
        {/* Brand Header */}
        <div 
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <span style={{ fontSize: "28px" }} className="animate-heartbeat">💖</span>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text)" }}>
              Two Hearts
            </h1>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Nhật ký hẹn hò</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Tab: Diary */}
          <button
            onClick={() => { setActiveTab("diary"); setSubView(null); }}
            className={`sidebar-nav-btn ${activeTab === "diary" && !subView ? "active" : ""}`}
          >
            {activeTab === "diary" && !subView ? <IoJournal size={18} /> : <IoJournalOutline size={18} />}
            <span>Lịch sử kỉ niệm</span>
          </button>

          {/* Tab: Profile */}
          <button
            onClick={() => { setActiveTab("profile"); setSubView(null); }}
            className={`sidebar-nav-btn ${activeTab === "profile" && !subView ? "active" : ""}`}
          >
            {activeTab === "profile" && !subView ? <IoHeart size={20} color="var(--accent)" /> : <IoHeartOutline size={18} />}
            <span>Thông tin đôi lứa</span>
          </button>

          {/* Tab: Settings */}
          <button
            onClick={() => { setActiveTab("settings"); setSubView(null); }}
            className={`sidebar-nav-btn ${activeTab === "settings" && !subView ? "active" : ""}`}
          >
            {activeTab === "settings" && !subView ? <IoSettings size={18} /> : <IoSettingsOutline size={18} />}
            <span>Cài đặt hệ thống</span>
          </button>
        </div>

        {/* Sidebar Footer Partner Profiles & Days */}
        <div 
          style={{
            padding: "20px",
            borderTop: "1px solid var(--border)",
            backgroundColor: "rgba(85, 150, 224, 0.02)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LazyImage 
              src={GoogleDriveService.resolveDriveUrl(boyUser?.avatar) || defaultBoyAvatar} 
              alt="Boy avatar" 
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid var(--primary)", objectFit: "cover" }}
            />
            <span style={{ fontSize: "14px", color: "var(--accent)" }} className="animate-heartbeat">❤️</span>
            <LazyImage 
              src={GoogleDriveService.resolveDriveUrl(girlUser?.avatar) || defaultGirlAvatar} 
              alt="Girl avatar" 
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid var(--accent)", objectFit: "cover" }}
            />
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>
            Bên nhau: <span style={{ color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 800 }}>{daysTogether}</span> ngày
          </div>
        </div>
      </div>

      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="mobile-header">
        <span style={{ fontSize: "20px" }}>💖</span>
        <span style={{ fontSize: "15px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--text)" }}>
          Two Hearts
        </span>
        <div style={{ width: "20px" }}></div> {/* balance item placeholder */}
      </div>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div className="main-content-scroll">
        {renderTabContent()}
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="mobile-bottom-bar">
        {/* Tab 1: Diary */}
        <button
          onClick={() => { setActiveTab("diary"); setSubView(null); }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: activeTab === "diary" && !subView ? "var(--primary-dark)" : "var(--text-muted)",
            width: "60px",
            height: "100%",
            gap: "4px"
          }}
        >
          {activeTab === "diary" && !subView ? <IoJournal size={22} /> : <IoJournalOutline size={22} />}
          <span style={{ fontSize: "10px", fontWeight: activeTab === "diary" && !subView ? 600 : 500 }}>Nhật ký</span>
        </button>

        {/* Tab 3: Profile */}
        <button
          onClick={() => { setActiveTab("profile"); setSubView(null); }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: activeTab === "profile" && !subView ? "var(--accent)" : "var(--text-muted)",
            width: "60px",
            height: "100%",
            gap: "4px"
          }}
        >
          {activeTab === "profile" && !subView ? <IoHeart size={24} color="var(--accent)" /> : <IoHeartOutline size={22} />}
          <span style={{ fontSize: "10px", fontWeight: activeTab === "profile" && !subView ? 600 : 500 }}>Hồ sơ</span>
        </button>

        {/* Tab 4: Settings */}
        <button
          onClick={() => { setActiveTab("settings"); setSubView(null); }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: activeTab === "settings" && !subView ? "var(--primary-dark)" : "var(--text-muted)",
            width: "60px",
            height: "100%",
            gap: "4px"
          }}
        >
          {activeTab === "settings" && !subView ? <IoSettings size={22} /> : <IoSettingsOutline size={22} />}
          <span style={{ fontSize: "10px", fontWeight: activeTab === "settings" && !subView ? 600 : 500 }}>Cài đặt</span>
        </button>
      </div>

      {/* Responsive layout styles block */}
      <style>{`
        /* Sidebar styles on desktop */
        .desktop-sidebar {
          width: 260px;
          height: 100vh;
          background-color: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 850;
        }

        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          fontWeight: 600;
          color: var(--text-muted);
          transition: all 0.2s;
          text-align: left;
        }

        .sidebar-nav-btn:hover {
          background-color: var(--primary-light);
          color: var(--primary-dark);
        }

        .sidebar-nav-btn.active {
          background-color: var(--primary);
          color: #ffffff;
        }

        /* Content space offset for fixed sidebar */
        .main-content-scroll {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
        }

        .mobile-header {
          display: none;
        }

        .mobile-bottom-bar {
          display: none;
        }

        /* Screen widths adaptations */
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .main-content-scroll {
            margin-left: 0 !important;
            height: auto !important;
            overflow-y: visible !important;
            padding-top: 56px;
            padding-bottom: 74px;
          }
          .mobile-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 56px;
            background-color: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            z-index: 800;
          }
          .mobile-bottom-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 64px;
            background-color: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 800;
            box-shadow: 0 -4px 12px rgba(85, 150, 224, 0.04);
          }
        }
      `}</style>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
      <CustomAlertProvider />
    </AppProvider>
  );
}
