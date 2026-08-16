import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AsyncStorageService,
  type DateHistory,
} from "../services/AsyncStorageService";
import { GoogleDriveService } from "../services/GoogleDriveService";
import {
  getLoveDays,
  getMilestoneEras,
  getMilestoneTheme,
  type MilestoneEraInfo,
} from "../utils/milestoneUtils";
import { formatDateOnly, formatDateTime } from "../utils/dateUtils";
import { LazyImage } from "../components/LazyImage";
import { CustomAlert } from "../components/CustomAlert";
import {
  IoChevronBackOutline,
  IoCreateOutline,
  IoCheckmarkCircle,
  IoLockClosedOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { MdZoomIn, MdZoomOut } from "react-icons/md";

interface MilestoneHistoryViewProps {
  acquaintedDateIso: string;
  onBack: () => void;
}

export const MilestoneHistoryView: React.FC<MilestoneHistoryViewProps> = ({
  acquaintedDateIso,
  onBack,
}) => {
  const [allHistory, setAllHistory] = useState<DateHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMilestone, setSelectedMilestone] =
    useState<MilestoneEraInfo | null>(null);

  // Storage for custom milestone notes
  const [milestoneNotes, setMilestoneNotes] = useState<Record<number, string>>(
    () => {
      try {
        const saved = localStorage.getItem("@datediary_milestone_notes");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    },
  );

  const [editingNote, setEditingNote] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Lightbox Viewer
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [showViewer, setShowViewer] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [rotateDegree, setRotateDegree] = useState<number>(0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const list = await AsyncStorageService.getHistory();
        // Sort descending
        const sorted = list.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        );
        setAllHistory(sorted);
      } catch (err) {
        console.error(err);
        CustomAlert.alert("Lỗi", "Không thể tải lịch sử kỷ niệm.");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const loveDays = getLoveDays(acquaintedDateIso);
  const eras = getMilestoneEras(acquaintedDateIso, loveDays);

  // Automatically select current active milestone on load
  useEffect(() => {
    if (eras.length > 0 && !selectedMilestone) {
      const current = eras.find((e) => e.status === "current") || eras[0];
      setSelectedMilestone(current);
      setEditingNote(milestoneNotes[current.milestoneDays] || "");
    }
  }, [eras, selectedMilestone]);

  const getMemoriesForEra = (era: MilestoneEraInfo) => {
    const startMs = era.startDate.getTime();
    const endMs = era.endDate.getTime();
    return allHistory.filter((item) => {
      const itemMs = new Date(item.time).getTime();
      return itemMs >= startMs && itemMs <= endMs;
    });
  };

  const handleSelectMilestone = (era: MilestoneEraInfo) => {
    setSelectedMilestone(era);
    setEditingNote(milestoneNotes[era.milestoneDays] || "");
    setIsEditing(false);
  };

  const handleSaveNote = () => {
    if (!selectedMilestone) return;
    const updated = {
      ...milestoneNotes,
      [selectedMilestone.milestoneDays]: editingNote.trim(),
    };
    setMilestoneNotes(updated);
    try {
      localStorage.setItem(
        "@datediary_milestone_notes",
        JSON.stringify(updated),
      );
      CustomAlert.success("Thành công", "Đã lưu lời nhắn cột mốc.");
    } catch (e) {
      console.error(e);
    }
    setIsEditing(false);
  };

  // Image zoom/drag handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPanOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setZoomScale(1);
    setRotateDegree(0);
    setPanOffset({ x: 0, y: 0 });
  };

  if (loading || !selectedMilestone) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  const activeTheme = getMilestoneTheme(selectedMilestone.milestoneDays);
  const eraMemories = getMemoriesForEra(selectedMilestone);
  const totalPhotos = eraMemories.reduce(
    (acc, m) => acc + (m.imageList?.length || 0),
    0,
  );

  return (
    <div className="container animate-fade" style={{ paddingBottom: "80px" }}>
      {/* Header View */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "8px",
            borderRadius: "50%",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary-dark)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IoChevronBackOutline size={22} />
        </button>
        <div>
          <h2
            style={{
              fontFamily: "'RobotoSlab', serif",
              fontWeight: 500,
              fontSize: "20px",
              color: "var(--text)",
              margin: 0,
            }}
          >
            Lịch Sử Cột Mốc Tình Yêu 🏆
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "4px",
              fontFamily: "'PlaywriteAUTAS', cursive",
            }}
          >
            Mỗi 100 ngày là một chặng đường gắn kết tình yêu
          </p>
        </div>
      </div>

      {/* Horizontal Milestone Navigation Tab Bar */}
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingTop: "8px",
          paddingBottom: "18px",
          marginTop: "-4px",
          marginBottom: "12px",
          width: "100%",
        }}
        className="hide-scrollbar"
      >
        {eras.map((era) => {
          const isSelected =
            selectedMilestone.milestoneDays === era.milestoneDays;
          const theme = getMilestoneTheme(era.milestoneDays);
          return (
            <button
              key={era.milestoneDays}
              onClick={() => handleSelectMilestone(era)}
              style={{
                flexShrink: 0,
                background: isSelected ? theme.bgGradient : "var(--surface)",
                color: isSelected ? "#ffffff" : "var(--text)",
                border: isSelected ? "none" : "1px solid var(--border)",
                boxShadow: isSelected
                  ? `0 8px 16px ${theme.glowColor}`
                  : "none",
                borderRadius: "16px",
                padding: "10px 18px",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.25s ease",
              }}
            >
              <span>{theme.icon}</span>
              <span>{era.title}</span>
              {era.status === "achieved" && (
                <IoCheckmarkCircle
                  size={14}
                  style={{ color: isSelected ? "#ffffff" : "#10b981" }}
                />
              )}
              {era.status === "current" && (
                <span
                  style={{
                    backgroundColor: isSelected
                      ? "rgba(255,255,255,0.3)"
                      : "var(--accent)",
                    color: "#ffffff",
                    fontSize: "9px",
                    padding: "2px 6px",
                    borderRadius: "8px",
                  }}
                >
                  HIỆN TẠI
                </span>
              )}
              {era.status === "upcoming" && (
                <IoLockClosedOutline
                  size={12}
                  style={{ color: isSelected ? "#ffffff" : "var(--lock)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Milestone Overview Card */}
      <div
        style={{
          background: activeTheme.bgGradient,
          borderRadius: "var(--radius-lg)",
          padding: "24px 20px",
          color: "#ffffff",
          boxShadow: `0 10px 25px -5px ${activeTheme.glowColor}`,
          border: activeTheme.borderStyle,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              backgroundColor: activeTheme.badgeBg,
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {activeTheme.icon} {selectedMilestone.title}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 600 }}>
            {selectedMilestone.status === "achieved"
              ? "✅ Đã Hoàn Thành"
              : selectedMilestone.status === "current"
                ? `🔥 Đang Diễn Ra (Ngày ${loveDays})`
                : "🔒 Chưa Đến"}
          </span>
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {activeTheme.themeName}
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: "13px",
            opacity: 0.95,
            fontStyle: "italic",
            lineHeight: 1.4,
          }}
        >
          "{activeTheme.quote}"
        </p>

        <div
          style={{
            marginTop: "4px",
            paddingTop: "10px",
            borderTop: "1px solid rgba(255,255,255,0.25)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <span>
            🗓️ Khoảng thời gian:{" "}
            {formatDateOnly(selectedMilestone.startDate.toISOString())} -{" "}
            {formatDateOnly(selectedMilestone.endDate.toISOString())}
          </span>
          <span>
            📸 {eraMemories.length} kỷ niệm • {totalPhotos} ảnh
          </span>
        </div>

        {selectedMilestone.status === "current" && (
          <div style={{ marginTop: "6px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                fontWeight: 600,
                opacity: 0.9,
              }}
            >
              <span>Đã đi được {selectedMilestone.progressPercent}%</span>
              <span>Còn {selectedMilestone.daysToTarget} ngày nữa 🎯</span>
            </div>
            <div
              style={{
                width: "100%",
                height: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                borderRadius: "3px",
                overflow: "hidden",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  width: `${selectedMilestone.progressPercent}%`,
                  height: "100%",
                  backgroundColor: "#ffffff",
                  borderRadius: "3px",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lời nhắn cột mốc card */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          marginBottom: "32px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text)",
              fontFamily: "'RobotoSlab', serif",
            }}
          >
            💌 Lời Nhắn Cột Mốc ({selectedMilestone.milestoneDays} Ngày)
          </h4>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--primary-dark)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <IoCreateOutline size={14} />
            </button>
          )}
        </div>

        {isEditing ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <textarea
              value={editingNote}
              onChange={(e) => setEditingNote(e.target.value)}
              placeholder="Ghi lại dòng tâm sự, cảm nghĩ của hai đứa khi trải qua giai đoạn cột mốc này nhé..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                fontSize: "13.5px",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
                style={{ padding: "6px 14px", fontSize: "12px" }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNote}
                className="btn btn-primary"
                style={{ padding: "6px 14px", fontSize: "12px" }}
              >
                Lưu lời nhắn
              </button>
            </div>
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "13.5px",
              color: milestoneNotes[selectedMilestone.milestoneDays]
                ? "var(--text)"
                : "var(--text-muted)",
              fontStyle: milestoneNotes[selectedMilestone.milestoneDays]
                ? "normal"
                : "italic",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {milestoneNotes[selectedMilestone.milestoneDays] ||
              "Chưa có lời nhắn nào. Hãy lưu lại những cảm xúc đặc biệt cho giai đoạn này nhé!"}
          </p>
        )}
      </div>

      {/* Timeline Section - Styled EXACTLY like the main diary page */}
      <div>
        <h4
          style={{
            fontFamily: "'RobotoSlab', serif",
            fontSize: "16px",
            color: "var(--text)",
            marginBottom: "20px",
          }}
        >
          📖 Nhật Ký Kỷ Niệm Của Cột Mốc ({eraMemories.length})
        </h4>

        {eraMemories.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--text-muted)",
              backgroundColor: "var(--glass-bg)",
              borderRadius: "16px",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: "40px" }}>🌸</span>
            <p style={{ margin: "10px 0 0 0", fontSize: "13.5px" }}>
              Không có nhật ký nào được viết trong cột mốc này.
            </p>
          </div>
        ) : (
          <div className="timeline-container" style={{ position: "relative" }}>
            {eraMemories.map((item, index) => (
              <div
                key={item.id}
                className="timeline-row show-instantly"
                style={{ zIndex: eraMemories.length - index }}
              >
                {/* Left Track wire & bullet node */}
                <div className="timeline-left-track">
                  <div
                    className="timeline-dot"
                    style={{ backgroundColor: activeTheme.accentColor }}
                  />
                </div>

                {/* Right content holding text card and images */}
                <div className="timeline-right-content">
                  {/* Card containing text */}
                  <div className="timeline-col-1-card">
                    {/* Time badge */}
                    <div
                      className="timeline-time-cute"
                      style={{ color: activeTheme.accentColor }}
                    >
                      📅 {formatDateTime(item.time)}
                    </div>

                    {/* Dating category type badge */}
                    <div
                      className="timeline-category-badge"
                      style={{
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary-dark)",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "10px",
                        fontWeight: 600,
                        width: "fit-content",
                      }}
                    >
                      {item.type}
                    </div>

                    {/* Diary notes text */}
                    <p className="diary-note" style={{ color: "var(--text)" }}>
                      {item.note}
                    </p>

                    {/* Occasion / Reason if exists */}
                    {item.reason && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "var(--background)",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "13px",
                          color: "var(--text)",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        <span style={{ color: activeTheme.accentColor }}>
                          💝 Dịp:
                        </span>
                        <span>{item.reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Images list grid layout */}
                  <div className="timeline-col-2-images">
                    {item.imageList && item.imageList.length > 0 ? (
                      <div className="diary-images-grid">
                        {item.imageList.map((imgUri, indexImg) => (
                          <div
                            key={indexImg}
                            className="diary-image-wrapper"
                            onClick={() => {
                              const flatImages = eraMemories.reduce<string[]>(
                                (acc, hItem) => {
                                  if (
                                    hItem.imageList &&
                                    hItem.imageList.length > 0
                                  ) {
                                    acc.push(...hItem.imageList);
                                  }
                                  return acc;
                                },
                                [],
                              );
                              const globalIndex = flatImages.indexOf(imgUri);
                              setViewerImages(flatImages);
                              setViewerIndex(
                                globalIndex >= 0 ? globalIndex : 0,
                              );
                              setZoomScale(1);
                              setRotateDegree(0);
                              setPanOffset({ x: 0, y: 0 });
                              setShowViewer(true);
                            }}
                          >
                            <LazyImage
                              src={GoogleDriveService.resolveDriveUrl(imgUri)}
                              alt="Kỷ niệm"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          minHeight: "80px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px dashed var(--border)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-muted)",
                          fontSize: "12px",
                          padding: "12px",
                        }}
                      >
                        🌸 Không có ảnh kỉ niệm
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zoom / Lightbox Image Viewer Overlay Portal */}
      {showViewer &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              userSelect: "none",
            }}
            onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchMove={(e) => {
              if (e.touches.length === 1) {
                handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={handleDragEnd}
          >
            {/* Top Toolbar Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                color: "#ffffff",
                zIndex: 10,
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600 }}>
                Ảnh {viewerIndex + 1} / {viewerImages.length}
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <button
                  onClick={() =>
                    setZoomScale((prev) => Math.min(3, prev + 0.25))
                  }
                  style={{ color: "#ffffff", cursor: "pointer" }}
                  title="Phóng to"
                >
                  <MdZoomIn size={24} />
                </button>
                <button
                  onClick={() =>
                    setZoomScale((prev) => Math.max(1, prev - 0.25))
                  }
                  style={{ color: "#ffffff", cursor: "pointer" }}
                  title="Thu nhỏ"
                >
                  <MdZoomOut size={24} />
                </button>
                <button
                  onClick={handleCloseViewer}
                  style={{
                    color: "#ffffff",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.1)",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Đóng xem ảnh"
                >
                  <IoCloseOutline size={24} />
                </button>
              </div>
            </div>

            {/* Main Interactive Drag/Zoom Image Area */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
            >
              <img
                src={GoogleDriveService.resolveDriveUrl(
                  viewerImages[viewerIndex],
                )}
                alt="Zoomed Kỷ niệm"
                draggable={false}
                style={{
                  maxHeight: "85vh",
                  maxWidth: "90vw",
                  objectFit: "contain",
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale}) rotate(${rotateDegree}deg)`,
                  transition: isDragging
                    ? "none"
                    : "transform 0.25s cubic-bezier(0.2, 0, 0, 1)",
                  cursor:
                    zoomScale > 1
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                }}
              />
            </div>

            {/* Footer Bottom Thumbnail & Next/Prev Controls */}
            {viewerImages.length > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "30px",
                  padding: "24px",
                  zIndex: 10,
                }}
              >
                <button
                  onClick={() =>
                    setViewerIndex((prev) =>
                      prev === 0 ? viewerImages.length - 1 : prev - 1,
                    )
                  }
                  style={{
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ←
                </button>
                <button
                  onClick={() =>
                    setViewerIndex((prev) =>
                      prev === viewerImages.length - 1 ? 0 : prev + 1,
                    )
                  }
                  style={{
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  →
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};
