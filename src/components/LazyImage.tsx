import React, { useState } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperStyle?: React.CSSProperties;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  style, 
  wrapperStyle, 
  onClick,
  ...props 
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Extract dimensions from style to keep the layout size intact while loading
  const width = style?.width || "100%";
  const height = style?.height || "100%";
  const borderRadius = style?.borderRadius || "0px";

  return (
    <div 
      style={{
        position: "relative",
        overflow: "hidden",
        width,
        height,
        borderRadius,
        display: "inline-block",
        backgroundColor: "var(--primary-light)",
        ...wrapperStyle
      }}
    >
      {/* Premium Shimmer Skeleton */}
      {!loaded && !error && (
        <div 
          className="skeleton-shimmer"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            borderRadius
          }}
        />
      )}

      {/* Error placeholder */}
      {error && (
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: "10px",
            backgroundColor: "var(--background)",
            padding: "4px",
            textAlign: "center",
            zIndex: 2
          }}
        >
          <span style={{ fontSize: "16px" }}>⚠️</span>
          <span style={{ fontSize: "9px", marginTop: "2px" }}>Lỗi tải ảnh</span>
        </div>
      )}

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        onClick={onClick}
        {...props}
        style={{
          ...style,
          width: "100%",
          height: "100%",
          objectFit: style?.objectFit || "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          cursor: onClick ? "pointer" : "default"
        }}
      />
    </div>
  );
};
