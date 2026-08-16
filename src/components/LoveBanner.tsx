import React, { useState } from "react";
import {
  getActiveAnniversaryBanners,
} from "../utils/anniversaryUtils";
import {
  IoChevronDownOutline,
  IoChevronUpOutline,
} from "react-icons/io5";

export const LoveBanner: React.FC = () => {
  // Active anniversaries list toggle state
  const [showAllAnniversaries, setShowAllAnniversaries] = useState<boolean>(false);

  // Evaluate active anniversary banners
  const { primaryBanner, allActiveBanners } = getActiveAnniversaryBanners();

  if (!primaryBanner) return null;

  return (
    <div style={{ width: "100%", marginBottom: "20px" }}>
      <div
        className="animate-fade"
        style={{
          background: primaryBanner.gradientBg,
          borderRadius: "var(--radius-lg)",
          padding: "16px 20px",
          color: primaryBanner.textColor,
          boxShadow: primaryBanner.level === "exact_day"
            ? "0 12px 28px -6px rgba(255, 20, 147, 0.45)"
            : "0 8px 20px -4px rgba(0, 0, 0, 0.15)",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s ease",
        }}
      >
        {/* Subtle sparkle overlay animation for celebration */}
        {primaryBanner.level === "exact_day" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)",
              animation: "pulse 2s infinite alternate",
            }}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "32px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
              {primaryBanner.accentIcon}
            </span>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    backdropFilter: "blur(4px)",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {primaryBanner.badgeLabel}
                </span>
                <span style={{ fontSize: "12px", opacity: 0.9 }}>
                  {primaryBanner.anniversary.note}
                </span>
              </div>

              <h3 style={{ margin: "4px 0 0 0", fontSize: "17px", fontWeight: 700, fontFamily: "'RobotoSlab', serif" }}>
                {primaryBanner.anniversary.title}
              </h3>
            </div>
          </div>

          {/* Countdown Days or Toggle Active List */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              {primaryBanner.diffDays === 0 ? (
                <span style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase" }}>
                  🎉 Hôm Nay!
                </span>
              ) : primaryBanner.diffDays < 0 ? (
                <span style={{ fontSize: "13px", fontWeight: 700 }}>
                  Tuần lễ kỷ niệm
                </span>
              ) : (
                <span style={{ fontSize: "14px", fontWeight: 800 }}>
                  Còn {primaryBanner.diffDays} ngày
                </span>
              )}
            </div>

            {allActiveBanners.length > 1 && (
              <button
                onClick={() => setShowAllAnniversaries(!showAllAnniversaries)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "#ffffff",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>+{allActiveBanners.length - 1} sự kiện</span>
                {showAllAnniversaries ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Secondary Active Anniversaries */}
        {showAllAnniversaries && allActiveBanners.length > 1 && (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255, 255, 255, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, opacity: 0.9 }}>
              Các sự kiện kỷ niệm sắp diễn ra khác:
            </div>
            {allActiveBanners.slice(1).map((b) => (
              <div
                key={b.anniversary.id}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{b.anniversary.icon}</span>
                  <span><strong>{b.anniversary.title}</strong> ({b.anniversary.month}/{b.anniversary.day})</span>
                </div>
                <span>{b.badgeLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
