import React from "react";
import { IoTrophyOutline } from "react-icons/io5";

interface MilestoneProfileSectionProps {
  acquaintedDateIso: string;
  onViewMilestones: () => void;
}

export const MilestoneProfileSection: React.FC<
  MilestoneProfileSectionProps
> = ({ onViewMilestones }) => {
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
