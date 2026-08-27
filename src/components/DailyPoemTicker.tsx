import React from "react";
import { getDailyPoem } from "../utils/poemUtils";

export const DailyPoemTicker: React.FC = () => {
  const poem = getDailyPoem();
  const poemText = poem.lines.join("   🌸   ");

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "32px",
        backgroundColor: "#ffffff",
        color: "#000000",
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        fontSize: "12.5px",
        fontFamily: "'PlaywriteAUTAS', cursive",
        lineHeight: "32px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 -1px 3px rgba(0, 0, 0, 0.05)",
        zIndex: 9999,
        boxSizing: "border-box",
      }}
    >
      <style>
        {`
          @keyframes marquee-scroll {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-33.333%, 0, 0); }
          }
          .marquee-content {
            display: inline-flex;
            white-space: nowrap;
            animation: marquee-scroll 35s linear infinite;
            will-change: transform;
          }
        `}
      </style>
      <div className="marquee-content">
        <span style={{ paddingRight: "100px" }}>💌 {poemText}</span>
        <span style={{ paddingRight: "100px" }}>💌 {poemText}</span>
        <span style={{ paddingRight: "100px" }}>💌 {poemText}</span>
      </div>
    </div>
  );
};
