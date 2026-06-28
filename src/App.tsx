import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { CustomAlertProvider } from "./components/CustomAlert";
import { OnboardingView } from "./screens/OnboardingView";
import { AddEventView } from "./screens/AddEventView";
import { ProfileView } from "./screens/ProfileView";
import { SettingsView } from "./screens/SettingsView";
import { EditProfileView } from "./screens/EditProfileView";
import { GoogleDriveService } from "./services/GoogleDriveService";
import { LazyImage } from "./components/LazyImage";
import { SecureStorage } from "./utils/encryption";
import { SecurityGate } from "./components/SecurityGate";

import {
  IoBookOutline,
  IoBook,
  IoHeartOutline,
  IoHeart,
  IoSettingsOutline,
  IoSettings,
} from "react-icons/io5";

import twoHeartsIcon from "./assets/images/two-hearts.png";
import heartGif from "./assets/gif/heart.gif";

type TabType = "diary" | "profile" | "settings";
type SubViewType = null | { type: "edit-profile"; userId: string };

const MainAppContent: React.FC = () => {
  const { users, isLoading, backgroundImageDesktop, backgroundImageMobile } =
    useApp();
  const [activeTab, setActiveTab] = useState<TabType>("diary");
  const [subView, setSubView] = useState<SubViewType>(null);

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

  // Auto Backup to Google Drive (once a day)
  useEffect(() => {
    // Only run when users are loaded, onboarding is completed, and security gate is passed
    if (!isSecured || !users || users.length < 2) return;

    const autoBackup = async () => {
      try {
        const loggedIn = await GoogleDriveService.isLoggedIn();
        if (!loggedIn) return;

        // Check if backed up today
        const lastBackupDate = SecureStorage.getItem(
          "@fireheart_last_backup_date",
        );
        const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

        if (lastBackupDate === today) {
          console.log("[AutoBackup] Data has already been backed up today.");
          return;
        }

        console.log("[AutoBackup] Starting daily automatic backup...");
        const result = await GoogleDriveService.performBackup();
        console.log(
          `[AutoBackup] Successfully backed up to ${result.fileName} (Total backups seen: ${result.totalBackups}, deleted: ${result.deletedCount})`,
        );

        // Update the last backup date in storage
        SecureStorage.setItem("@fireheart_last_backup_date", today);
      } catch (err) {
        console.error("[AutoBackup] Failed to run automated backup:", err);
      }
    };

    autoBackup();
  }, [isSecured, users]);

  // Dynamic body background color based on custom backgrounds existence
  useEffect(() => {
    const hasBg = !!(backgroundImageDesktop || backgroundImageMobile);
    if (!hasBg) {
      document.body.style.backgroundColor = "transparent";
      document.documentElement.style.backgroundColor = "transparent";
    } else {
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    }
  }, [backgroundImageDesktop, backgroundImageMobile]);

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
          backgroundColor:
            backgroundImageDesktop || backgroundImageMobile
              ? "var(--background)"
              : "transparent",
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

  const activeBgDesktop = backgroundImageDesktop
    ? GoogleDriveService.resolveDriveUrl(backgroundImageDesktop, 1920)
    : null;
  const activeBgMobile = backgroundImageMobile
    ? GoogleDriveService.resolveDriveUrl(backgroundImageMobile, 1920)
    : null;

  return (
    <div className="main-wrapper">
      {activeBgDesktop && (
        <img
          src={activeBgDesktop}
          referrerPolicy="no-referrer"
          className="desktop-bg-img"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      )}
      {activeBgMobile && (
        <img
          src={activeBgMobile}
          referrerPolicy="no-referrer"
          className="mobile-bg-img"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
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
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              border: "2px solid var(--accent)",
              objectFit: "cover",
            }}
          />
          <img
            src={heartGif}
            alt="Heart animation"
            style={{
              width: "36px",
              height: "36px",
              objectFit: "contain",
              margin: "0 2px",
            }}
          />
          <LazyImage
            src={
              GoogleDriveService.resolveDriveUrl(girlUser?.avatar) ||
              defaultGirlAvatar
            }
            alt="Girl avatar"
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              border: "2px solid var(--primary)",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      {/* DESKTOP SIDEBAR PANEL (Transparent controls layout) */}
      <div className="desktop-sidebar">
        {/* Brand Header (No background, text only) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            pointerEvents: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={twoHeartsIcon}
              alt="Two Hearts Logo"
              style={{ width: "80px", height: "80px", objectFit: "contain" }}
            />
            <div>
              <h1
                style={{
                  fontSize: "28px", // LilitaOne looks better slightly larger
                  fontWeight: 400, // LilitaOne is a display font, works best with normal weight
                  fontFamily: "'LilitaOne', cursive",
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                Two Hearts
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "'PlaywriteAUTAS', cursive",
                  lineHeight: 1.6,
                  marginTop: "4px",
                }}
              >
                Nhật ký hẹn hò
              </span>
            </div>
          </div>
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
              <IoBook size={20} />
            ) : (
              <IoBookOutline size={20} />
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
        <img
          src={twoHeartsIcon}
          alt="Two Hearts Logo"
          style={{ width: "24px", height: "24px", objectFit: "contain" }}
        />
        <span
          style={{
            fontSize: "18px", // LilitaOne works better slightly larger
            fontWeight: 400,
            fontFamily: "'LilitaOne', cursive",
            color: "var(--text)",
          }}
        >
          Two Hearts
        </span>
        <div style={{ width: "24px" }}></div> {/* balance item placeholder */}
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
          className={`mobile-bottom-btn diary-btn ${activeTab === "diary" && !subView ? "active" : ""}`}
        >
          {activeTab === "diary" && !subView ? (
            <IoBook size={22} />
          ) : (
            <IoBookOutline size={22} />
          )}
        </button>

        {/* Tab 2: Profile */}
        <button
          onClick={() => {
            setActiveTab("profile");
            setSubView(null);
          }}
          className={`mobile-bottom-btn profile-btn ${activeTab === "profile" && !subView ? "active" : ""}`}
        >
          {activeTab === "profile" && !subView ? (
            <IoHeart size={24} />
          ) : (
            <IoHeartOutline size={22} />
          )}
        </button>

        {/* Tab 3: Settings */}
        <button
          onClick={() => {
            setActiveTab("settings");
            setSubView(null);
          }}
          className={`mobile-bottom-btn settings-btn ${activeTab === "settings" && !subView ? "active" : ""}`}
        >
          {activeTab === "settings" && !subView ? (
            <IoSettings size={22} />
          ) : (
            <IoSettingsOutline size={22} />
          )}
        </button>
      </div>

      {/* Responsive layout styles block */}
      <style>{`
        /* Sidebar styles on desktop */
        .desktop-sidebar {
          width: 280px;
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
          background-color: var(--surface);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15);
          animation: pill-heartbeat-shadow 3.6s infinite ease-in-out;
        }

        @keyframes pill-heartbeat-shadow {
          /* Fast Beat 1 */
          0% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 0px rgba(85, 150, 224, 0.4), 0 0 0 0px rgba(85, 150, 224, 0.2);
          }
          3% {
            transform: scale(1.04);
            box-shadow: 0 8px 20px rgba(85, 150, 224, 0.3), 0 0 0 12px rgba(85, 150, 224, 0.25), 0 0 0 24px rgba(85, 150, 224, 0.12);
          }
          6% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 24px rgba(85, 150, 224, 0), 0 0 0 48px rgba(85, 150, 224, 0);
          }
          11.1% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 0px rgba(85, 150, 224, 0), 0 0 0 0px rgba(85, 150, 224, 0);
          }

          /* Fast Beat 2 */
          14.1% {
            transform: scale(1.04);
            box-shadow: 0 8px 20px rgba(85, 150, 224, 0.3), 0 0 0 12px rgba(85, 150, 224, 0.25), 0 0 0 24px rgba(85, 150, 224, 0.12);
          }
          17.1% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 24px rgba(85, 150, 224, 0), 0 0 0 48px rgba(85, 150, 224, 0);
          }
          22.2% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 0px rgba(85, 150, 224, 0), 0 0 0 0px rgba(85, 150, 224, 0);
          }

          /* Fast Beat 3 */
          25.2% {
            transform: scale(1.04);
            box-shadow: 0 8px 20px rgba(85, 150, 224, 0.3), 0 0 0 12px rgba(85, 150, 224, 0.25), 0 0 0 24px rgba(85, 150, 224, 0.12);
          }
          28.2% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 24px rgba(85, 150, 224, 0), 0 0 0 48px rgba(85, 150, 224, 0);
          }
          33.3% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 0px rgba(85, 150, 224, 0), 0 0 0 0px rgba(85, 150, 224, 0);
          }

          /* Slow Beat 1 */
          38.8% {
            transform: scale(1.04);
            box-shadow: 0 8px 20px rgba(85, 150, 224, 0.3), 0 0 0 12px rgba(85, 150, 224, 0.25), 0 0 0 24px rgba(85, 150, 224, 0.12);
          }
          44.4% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 24px rgba(85, 150, 224, 0), 0 0 0 48px rgba(85, 150, 224, 0);
          }
          55.5% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 0px rgba(85, 150, 224, 0), 0 0 0 0px rgba(85, 150, 224, 0);
          }

          /* Slow Beat 2 */
          61.1% {
            transform: scale(1.04);
            box-shadow: 0 8px 20px rgba(85, 150, 224, 0.3), 0 0 0 12px rgba(85, 150, 224, 0.25), 0 0 0 24px rgba(85, 150, 224, 0.12);
          }
          66.6% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 24px rgba(85, 150, 224, 0), 0 0 0 48px rgba(85, 150, 224, 0);
          }
          77.7% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 0px rgba(85, 150, 224, 0), 0 0 0 0px rgba(85, 150, 224, 0);
          }

          /* Slow Beat 3 */
          83.3% {
            transform: scale(1.04);
            box-shadow: 0 8px 20px rgba(85, 150, 224, 0.3), 0 0 0 12px rgba(85, 150, 224, 0.25), 0 0 0 24px rgba(85, 150, 224, 0.12);
          }
          88.8% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 24px rgba(85, 150, 224, 0), 0 0 0 48px rgba(85, 150, 224, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.15), 0 0 0 0px rgba(85, 150, 224, 0), 0 0 0 0px rgba(85, 150, 224, 0);
          }
        }

        .desktop-bg-img {
          display: block;
        }

        .mobile-bg-img {
          display: none;
        }

        /* Content space offset for fixed sidebar */
        .main-content-scroll {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          margin-left: 280px;
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
          .desktop-bg-img {
            display: none !important;
          }
          .mobile-bg-img {
            display: block !important;
          }
          .desktop-sidebar {
            display: none !important;
          }
          .desktop-together-pill {
            display: flex !important;
            top: 12px !important;
            left: 0 !important;
            right: 0 !important;
            margin: 0 auto !important;
            width: max-content !important;
            z-index: 900 !important;
          }
          .main-content-scroll {
            margin-left: 0 !important;
            height: auto !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            padding-top: 76px !important;
            padding-bottom: 74px;
          }
          .mobile-header {
            display: none !important;
          }
          .mobile-bottom-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 74px;
            background-color: transparent;
            backdrop-filter: none;
            border-top: none;
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 800;
            box-shadow: none;
            pointer-events: none;
            padding-bottom: env(safe-area-inset-bottom);
          }
          .mobile-bottom-btn {
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
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            transition: all var(--transition-fast);
            pointer-events: auto;
          }
          .mobile-bottom-btn:active {
            transform: scale(0.9);
          }
          .mobile-bottom-btn.active.diary-btn,
          .mobile-bottom-btn.active.settings-btn {
            background-color: var(--primary);
            color: #ffffff;
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(85, 150, 224, 0.35);
          }
          .mobile-bottom-btn.active.profile-btn {
            background-color: var(--accent);
            color: #ffffff;
            border-color: var(--accent);
            box-shadow: 0 4px 12px rgba(243, 104, 224, 0.35);
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
