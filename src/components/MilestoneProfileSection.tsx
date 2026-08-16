import React from "react";
import { getLoveDays, getMilestoneTheme } from "../utils/milestoneUtils";
import { IoTrophyOutline } from "react-icons/io5";

interface MilestoneProfileSectionProps {
  acquaintedDateIso: string;
  onViewMilestones: () => void;
}

export const MilestoneProfileSection: React.FC<
  MilestoneProfileSectionProps
> = ({ acquaintedDateIso, onViewMilestones }) => {
  const loveDays = getLoveDays(acquaintedDateIso);
  const milestoneTheme = getMilestoneTheme(loveDays);

  const milestoneIndex = Math.floor(loveDays / 100);
  const currentMilestoneStartDays = milestoneIndex * 100;
  const daysInCurrentMilestone = loveDays - currentMilestoneStartDays;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((daysInCurrentMilestone / 100) * 100)),
  );
  const daysToNextMilestone = (milestoneIndex + 1) * 100 - loveDays;

  return (
    <div style={{ marginTop: "32px", width: "100%" }}>
      {/* Section Header */}
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onViewMilestones}
          style={{
            backgroundColor: "var(--primary-light)",
            color: "var(--primary-dark)",
            border: "1px solid var(--border)",
            padding: "8px 14px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
        >
          <IoTrophyOutline size={16} />
          <span>Lịch sử cột mốc</span>
        </button>
      </div>
    </div>
  );
};
