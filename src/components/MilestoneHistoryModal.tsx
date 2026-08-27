import React, { useState } from "react";
import { createPortal } from "react-dom";
import { type DateHistory } from "../services/AsyncStorageService";
import {
  getLoveDays,
  getMilestoneEras,
  getMilestoneTheme,
  type MilestoneEraInfo,
} from "../utils/milestoneUtils";
import { formatDateOnly } from "../utils/dateUtils";
import { CustomAlert } from "./CustomAlert";
import {
  IoCloseOutline,
  IoCalendarOutline,
  IoImagesOutline,
  IoChevronForwardOutline,
  IoCheckmarkCircle,
  IoLockClosedOutline,
  IoCreateOutline,
  IoSparkles,
} from "react-icons/io5";

interface MilestoneHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  confessionDateIso: string;
  allHistory: DateHistory[];
  onSelectMilestoneFilter?: (startDate: string, endDate: string) => void;
}

export const MilestoneHistoryModal: React.FC<MilestoneHistoryModalProps> = ({
  isOpen,
  onClose,
  confessionDateIso,
  allHistory,
  onSelectMilestoneFilter,
}) => {
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

  if (!isOpen) return null;

  const currentDays = getLoveDays(confessionDateIso);
  const eras = getMilestoneEras(confessionDateIso, currentDays);
  const currentMilestoneIndex = Math.floor(currentDays / 100);

  // Helper to find history items inside an era's time window
  const getMemoriesForEra = (era: MilestoneEraInfo) => {
    const startMs = era.startDate.getTime();
    const endMs = era.endDate.getTime();

    return allHistory.filter((item) => {
      const itemMs = new Date(item.time).getTime();
      return itemMs >= startMs && itemMs <= endMs;
    });
  };

  const handleOpenDetail = (era: MilestoneEraInfo) => {
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
      CustomAlert.success("Thành công", "Đã lưu lời nhắn kỷ niệm cho cột mốc!");
    } catch (e) {
      console.error(e);
    }
    setIsEditing(false);
  };

  const handleApplyFilter = (era: MilestoneEraInfo) => {
    if (onSelectMilestoneFilter) {
      const yyyyStart = era.startDate.getFullYear();
      const mmStart = String(era.startDate.getMonth() + 1).padStart(2, "0");
      const ddStart = String(era.startDate.getDate()).padStart(2, "0");

      const yyyyEnd = era.endDate.getFullYear();
      const mmEnd = String(era.endDate.getMonth() + 1).padStart(2, "0");
      const ddEnd = String(era.endDate.getDate()).padStart(2, "0");

      onSelectMilestoneFilter(
        `${yyyyStart}-${mmStart}-${ddStart}`,
        `${yyyyEnd}-${mmEnd}-${ddEnd}`,
      );
      onClose();
    }
  };

  return createPortal(
    <div className="custom-alert-overlay" style={{ zIndex: 99999 }}>
      <div
        className="custom-alert-modal animate-scale-in"
        style={{
          width: "92%",
          maxWidth: "700px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          borderRadius: "24px",
          backgroundColor: "var(--surface)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            background: "linear-gradient(135deg, #f78fb3 0%, #336fa7 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
              }}
            >
              🏆
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  fontFamily: "'RobotoSlab', serif",
                }}
              >
                Lịch Sử Cột Mốc Tình Yêu
              </h3>
              <p
                style={{ margin: "2px 0 0 0", fontSize: "12px", opacity: 0.9 }}
              >
                Hành trình cứ 100 ngày lại viết tiếp một chương đẹp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "#ffffff",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        {/* Current Overview Bar */}
        <div
          style={{
            backgroundColor: "var(--primary-light)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
            fontSize: "13px",
            color: "var(--text)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IoSparkles style={{ color: "var(--accent)" }} size={16} />
            <span>
              Đã bên nhau: <strong>{currentDays} ngày</strong>
            </span>
          </div>
          <div>
            <span>
              Cột mốc hiện tại:{" "}
              <strong>{currentMilestoneIndex * 100} Ngày</strong>
            </span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {selectedMilestone ? (
            /* Detailed View of Single Milestone */
            <div
              className="animate-fade"
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <button
                onClick={() => setSelectedMilestone(null)}
                style={{
                  alignSelf: "flex-start",
                  background: "none",
                  border: "none",
                  color: "var(--primary-dark)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 0",
                }}
              >
                ← Quay lại danh sách cột mốc
              </button>

              {(() => {
                const theme = getMilestoneTheme(
                  selectedMilestone.milestoneDays,
                );
                const memories = getMemoriesForEra(selectedMilestone);
                const totalPhotos = memories.reduce(
                  (acc, m) => acc + (m.imageList?.length || 0),
                  0,
                );

                return (
                  <>
                    {/* Header Card of Milestone */}
                    <div
                      style={{
                        background: theme.bgGradient,
                        borderRadius: "16px",
                        padding: "20px",
                        color: "#ffffff",
                        boxShadow: `0 10px 20px ${theme.glowColor}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
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
                            background: theme.badgeBg,
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                          }}
                        >
                          {theme.icon} {selectedMilestone.title}
                        </span>
                        <span style={{ fontSize: "12px", opacity: 0.9 }}>
                          {selectedMilestone.status === "achieved"
                            ? "✅ Đã đạt cột mốc"
                            : selectedMilestone.status === "current"
                              ? "🔥 Đang diễn ra"
                              : "🔒 Chưa diễn ra"}
                        </span>
                      </div>

                      <h2
                        style={{
                          margin: 0,
                          fontSize: "22px",
                          fontFamily: "'RobotoSlab', serif",
                          fontWeight: 700,
                        }}
                      >
                        {theme.themeName}
                      </h2>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          opacity: 0.95,
                          fontStyle: "italic",
                        }}
                      >
                        "{theme.quote}"
                      </p>

                      <div
                        style={{
                          marginTop: "8px",
                          paddingTop: "10px",
                          borderTop: "1px solid rgba(255, 255, 255, 0.3)",
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                        }}
                      >
                        <span>
                          🗓️ Từ{" "}
                          {formatDateOnly(
                            selectedMilestone.startDate.toISOString(),
                          )}{" "}
                          đến{" "}
                          {formatDateOnly(
                            selectedMilestone.endDate.toISOString(),
                          )}
                        </span>
                        <span>
                          📸 {memories.length} kỷ niệm ({totalPhotos} ảnh)
                        </span>
                      </div>
                    </div>

                    {/* Milestone Reflection Note Section */}
                    <div
                      style={{
                        backgroundColor: "var(--glass-bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "16px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          💌 Lời Nhắn Cột Mốc ({selectedMilestone.milestoneDays}{" "}
                          Ngày)
                        </h4>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--primary-dark)",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
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
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <textarea
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            placeholder="Viết cảm tưởng, những câu chuyện đáng nhớ nhất trong 100 ngày này..."
                            rows={3}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "10px",
                              border: "1px solid var(--primary)",
                              fontSize: "13px",
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
                            fontSize: "13px",
                            color: milestoneNotes[
                              selectedMilestone.milestoneDays
                            ]
                              ? "var(--text)"
                              : "var(--text-muted)",
                            fontStyle: milestoneNotes[
                              selectedMilestone.milestoneDays
                            ]
                              ? "normal"
                              : "italic",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {milestoneNotes[selectedMilestone.milestoneDays] ||
                            "Chưa có lời nhắn nào. Hãy bấm 'Chỉnh sửa' để lưu lại dòng tâm sự ý nghĩa cho cột mốc này!"}
                        </p>
                      )}
                    </div>

                    {/* Filter Action Button */}
                    <button
                      onClick={() => handleApplyFilter(selectedMilestone)}
                      className="btn btn-primary"
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <IoCalendarOutline size={18} />
                      <span>
                        Xem tất cả {memories.length} kỷ niệm trong cột mốc này
                      </span>
                    </button>

                    {/* List of Memories inside Milestone */}
                    <div style={{ marginTop: "8px" }}>
                      <h4
                        style={{
                          fontSize: "14px",
                          margin: "0 0 10px 0",
                          color: "var(--text)",
                        }}
                      >
                        📖 Nhật ký ghi nhận ({memories.length})
                      </h4>

                      {memories.length === 0 ? (
                        <p
                          style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                            textAlign: "center",
                            padding: "20px",
                          }}
                        >
                          Chưa có ghi chép nhật ký nào trong khoảng 100 ngày
                          này.
                        </p>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {memories.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                padding: "12px 14px",
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
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
                                    backgroundColor: "var(--primary-light)",
                                    color: "var(--primary-dark)",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {item.type}
                                </span>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {formatDateOnly(item.time)}
                                </span>
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "13px",
                                  color: "var(--text)",
                                  lineHeight: 1.4,
                                }}
                              >
                                {item.note}
                              </p>
                              {item.imageList && item.imageList.length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  <IoImagesOutline size={14} />
                                  <span>{item.imageList.length} hình ảnh</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* Eras List View */
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {eras.map((era) => {
                const theme = getMilestoneTheme(era.milestoneDays);
                const memories = getMemoriesForEra(era);

                return (
                  <div
                    key={era.milestoneDays}
                    onClick={() => handleOpenDetail(era)}
                    style={{
                      position: "relative",
                      background:
                        era.status === "current"
                          ? theme.bgGradient
                          : "var(--surface)",
                      border:
                        era.status === "current"
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      borderRadius: "16px",
                      padding: "16px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      color:
                        era.status === "current" ? "#ffffff" : "var(--text)",
                      boxShadow:
                        era.status === "current"
                          ? `0 8px 20px ${theme.glowColor}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "28px",
                            width: "46px",
                            height: "46px",
                            borderRadius: "12px",
                            backgroundColor:
                              era.status === "current"
                                ? "rgba(255, 255, 255, 0.25)"
                                : "var(--primary-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {theme.icon}
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <h4
                              style={{
                                margin: 0,
                                fontSize: "15px",
                                fontWeight: 700,
                              }}
                            >
                              {era.title}
                            </h4>
                            {era.status === "achieved" && (
                              <IoCheckmarkCircle
                                size={16}
                                style={{ color: "#10b981" }}
                              />
                            )}
                            {era.status === "current" && (
                              <span
                                style={{
                                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                }}
                              >
                                ĐANG TIẾN HÀNH
                              </span>
                            )}
                            {era.status === "upcoming" && (
                              <IoLockClosedOutline
                                size={14}
                                style={{ color: "var(--lock)" }}
                              />
                            )}
                          </div>

                          <p
                            style={{
                              margin: "2px 0 0 0",
                              fontSize: "12px",
                              opacity: era.status === "current" ? 0.95 : 0.7,
                            }}
                          >
                            {theme.themeName} • {memories.length} kỷ niệm
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {era.status === "current" && (
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "14px", fontWeight: 800 }}>
                              {era.progressPercent}%
                            </span>
                            <div style={{ fontSize: "10px", opacity: 0.8 }}>
                              Còn {era.daysToTarget} ngày
                            </div>
                          </div>
                        )}
                        <IoChevronForwardOutline size={18} opacity={0.6} />
                      </div>
                    </div>

                    {/* Progress bar for current milestone */}
                    {era.status === "current" && (
                      <div
                        style={{
                          marginTop: "12px",
                          width: "100%",
                          height: "6px",
                          backgroundColor: "rgba(255, 255, 255, 0.3)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${era.progressPercent}%`,
                            height: "100%",
                            backgroundColor: "#ffffff",
                            borderRadius: "3px",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
