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
import { SecureStorage } from "./utils/encryption";
import { SecurityGate } from "./components/SecurityGate";

import {
  IoJournalOutline,
  IoJournal,
  IoHeartOutline,
  IoHeart,
  IoSettingsOutline,
  IoSettings,
} from "react-icons/io5";

import { AsyncStorageService } from "./services/AsyncStorageService";

type TabType = "diary" | "profile" | "settings";
type SubViewType = null | { type: "edit-profile"; userId: string };

const MainAppContent: React.FC = () => {
  const { users, isLoading, backgroundImage } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("diary");
  const [subView, setSubView] = useState<SubViewType>(null);
  const [daysTogether, setDaysTogether] = useState<number>(0);

  // Security Gate State
  const [isSecured, setIsSecured] = useState<boolean>(() => {
    try {
      const decryptedAuthDate = SecureStorage.getItem(
        "@fireheart_security_passed",
      );
      const decryptedLock = SecureStorage.getItem("@fireheart_security_lock");

      if (decryptedLock) {
        const lockTimestamp = parseInt(decryptedLock, 10);
        if (!isNaN(lockTimestamp) && lockTimestamp > Date.now()) {
          return false;
        }
      }

      if (decryptedAuthDate) {
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
    const startTime = AsyncStorageService.getStartTime();
    const duration = getDurationSince(startTime.acquaintedDay);
    setDaysTogether(duration.days);

    const interval = setInterval(() => {
      setDaysTogether(getDurationSince(startTime.acquaintedDay).days);
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
          gap: "16px",
        }}
      >
        <div
          style={{ fontSize: "52px", color: "var(--accent)" }}
          className="animate-heartbeat"
        >
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
  const defaultBoyAvatar =
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150";
  const defaultGirlAvatar =
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150";

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
            onEditProfile={(userId) =>
              setSubView({ type: "edit-profile", userId })
            }
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
      {backgroundImage && (
        <img
          src={backgroundImage}
          referrerPolicy="no-referrer"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
            zIndex: -10,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Floating Together Pill on Top-Right */}
      <div className="desktop-together-pill">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <LazyImage
            src={
              GoogleDriveService.resolveDriveUrl(boyUser?.avatar) ||
              defaultBoyAvatar
            }
            alt="Boy avatar"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2px solid var(--accent)",
              objectFit: "cover",
            }}
          />
          <span
            style={{ fontSize: "16px", color: "var(--accent)" }}
            className="animate-heartbeat"
          >
            ❤️
          </span>
          <LazyImage
            src={
              GoogleDriveService.resolveDriveUrl(girlUser?.avatar) ||
              defaultGirlAvatar
            }
            alt="Girl avatar"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2px solid var(--primary)",
              objectFit: "cover",
            }}
          />
        </div>
        <div
          style={{
            width: "1px",
            height: "20px",
            backgroundColor: "var(--border)",
            margin: "0 4px",
          }}
        ></div>
        <div
          style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}
        >
          Bên nhau:{" "}
          <span
            style={{
              color: "var(--accent)",
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 800,
            }}
          >
            {daysTogether}
          </span>{" "}
          ngày
        </div>
      </div>

      {/* DESKTOP SIDEBAR PANEL (Transparent controls layout) */}
      <div className="desktop-sidebar">
        {/* Brand Header (No background, text only) */}
        <div
          style={{
            padding: "24px 0",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            pointerEvents: "auto",
          }}
        >
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 850,
              fontFamily: "var(--font-display)",
              color: "var(--text)",
              margin: 0,
            }}
          >
            Two Hearts
          </h1>
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            Nhật ký hẹn hò
          </span>
        </div>

        {/* Navigation Tabs (3 separate circular buttons) */}
        <div
          style={{
            padding: "24px 0",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            pointerEvents: "auto",
          }}
        >
          {/* Tab: Diary */}
          <button
            onClick={() => {
              setActiveTab("diary");
              setSubView(null);
            }}
            className={`sidebar-nav-btn ${activeTab === "diary" && !subView ? "active" : ""}`}
            title="Nhật ký"
          >
            {activeTab === "diary" && !subView ? (
              <IoJournal size={20} />
            ) : (
              <IoJournalOutline size={20} />
            )}
          </button>

          {/* Tab: Profile */}
          <button
            onClick={() => {
              setActiveTab("profile");
              setSubView(null);
            }}
            className={`sidebar-nav-btn ${activeTab === "profile" && !subView ? "active" : ""}`}
            title="Chúng mình"
          >
            {activeTab === "profile" && !subView ? (
              <IoHeart size={22} color="var(--accent)" />
            ) : (
              <IoHeartOutline size={22} />
            )}
          </button>

          {/* Tab: Settings */}
          <button
            onClick={() => {
              setActiveTab("settings");
              setSubView(null);
            }}
            className={`sidebar-nav-btn ${activeTab === "settings" && !subView ? "active" : ""}`}
            title="Cài đặt hệ thống"
          >
            {activeTab === "settings" && !subView ? (
              <IoSettings size={20} />
            ) : (
              <IoSettingsOutline size={20} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="mobile-header">
        <span style={{ fontSize: "20px" }}>💖</span>
        <span
          style={{
            fontSize: "15px",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            color: "var(--text)",
          }}
        >
          Two Hearts
        </span>
        <div style={{ width: "20px" }}></div> {/* balance item placeholder */}
      </div>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div className="main-content-scroll">{renderTabContent()}</div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="mobile-bottom-bar">
        {/* Tab 1: Diary */}
        <button
          onClick={() => {
            setActiveTab("diary");
            setSubView(null);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color:
              activeTab === "diary" && !subView
                ? "var(--primary-dark)"
                : "var(--text-muted)",
            width: "60px",
            height: "100%",
            gap: "4px",
          }}
        >
          {activeTab === "diary" && !subView ? (
            <IoJournal size={22} />
          ) : (
            <IoJournalOutline size={22} />
          )}
          <span
            style={{
              fontSize: "10px",
              fontWeight: activeTab === "diary" && !subView ? 600 : 500,
            }}
          >
            Nhật ký
          </span>
        </button>

        {/* Tab 3: Profile */}
        <button
          onClick={() => {
            setActiveTab("profile");
            setSubView(null);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color:
              activeTab === "profile" && !subView
                ? "var(--accent)"
                : "var(--text-muted)",
            width: "60px",
            height: "100%",
            gap: "4px",
          }}
        >
          {activeTab === "profile" && !subView ? (
            <IoHeart size={24} color="var(--accent)" />
          ) : (
            <IoHeartOutline size={22} />
          )}
          <span
            style={{
              fontSize: "10px",
              fontWeight: activeTab === "profile" && !subView ? 600 : 500,
            }}
          >
            Hồ sơ
          </span>
        </button>

        {/* Tab 4: Settings */}
        <button
          onClick={() => {
            setActiveTab("settings");
            setSubView(null);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color:
              activeTab === "settings" && !subView
                ? "var(--primary-dark)"
                : "var(--text-muted)",
            width: "60px",
            height: "100%",
            gap: "4px",
          }}
        >
          {activeTab === "settings" && !subView ? (
            <IoSettings size={22} />
          ) : (
            <IoSettingsOutline size={22} />
          )}
          <span
            style={{
              fontSize: "10px",
              fontWeight: activeTab === "settings" && !subView ? 600 : 500,
            }}
          >
            Cài đặt
          </span>
        </button>
      </div>

      {/* Responsive layout styles block */}
      <style>{`
        /* Sidebar styles on desktop */
        .desktop-sidebar {
          width: 260px;
          height: 100vh;
          background-color: transparent;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 850;
          padding: 24px;
          pointer-events: none;
        }

        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          color: var(--text-muted);
          background-color: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: all var(--transition-fast);
        }

        .sidebar-nav-btn:hover {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          transform: translateY(-2px);
        }

        .sidebar-nav-btn.active {
          background-color: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(85, 150, 224, 0.3);
        }

        .desktop-together-pill {
          position: fixed;
          top: 24px;
          right: 40px;
          z-index: 850;
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          box-shadow: 0 4px 12px rgba(85, 150, 224, 0.04);
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
          .desktop-together-pill {
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
