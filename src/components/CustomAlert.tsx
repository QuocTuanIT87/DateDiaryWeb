import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  IoCheckmarkCircleOutline, 
  IoAlertCircleOutline, 
  IoCloseCircleOutline, 
  IoInformationCircleOutline 
} from "react-icons/io5";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export type AlertType = "info" | "success" | "error" | "warning";

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: { cancelable?: boolean };
  type?: AlertType;
}

let globalSetAlertConfig: ((config: AlertConfig | null) => void) | null = null;

export const CustomAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean },
    type?: AlertType
  ) => {
    let inferredType: AlertType = type || "info";

    if (!type) {
      const textToSearch = `${title} ${message || ""}`.toLowerCase();
      if (
        textToSearch.includes("lỗi") ||
        textToSearch.includes("thất bại") ||
        textToSearch.includes("không thể") ||
        textToSearch.includes("hỏng") ||
        textToSearch.includes("error") ||
        textToSearch.includes("failed")
      ) {
        inferredType = "error";
      } else if (
        textToSearch.includes("thành công") ||
        textToSearch.includes("hoàn tất") ||
        textToSearch.includes("hoàn thành") ||
        textToSearch.includes("success") ||
        textToSearch.includes("completed")
      ) {
        inferredType = "success";
      } else if (
        textToSearch.includes("yêu cầu") ||
        textToSearch.includes("cảnh báo") ||
        textToSearch.includes("xác nhận") ||
        textToSearch.includes("xóa") ||
        textToSearch.includes("ngắt kết nối") ||
        textToSearch.includes("chú ý") ||
        textToSearch.includes("warning") ||
        textToSearch.includes("delete")
      ) {
        inferredType = "warning";
      }
    }

    if (globalSetAlertConfig) {
      globalSetAlertConfig({
        title,
        message,
        buttons,
        options,
        type: inferredType,
      });
    } else {
      console.warn("CustomAlert has not been initialized. Please mount CustomAlertProvider at the root of your app.");
    }
  },

  success: (title: string, message?: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => {
    CustomAlert.alert(title, message, buttons, options, "success");
  },

  error: (title: string, message?: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => {
    CustomAlert.alert(title, message, buttons, options, "error");
  },

  warning: (title: string, message?: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => {
    CustomAlert.alert(title, message, buttons, options, "warning");
  },

  info: (title: string, message?: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => {
    CustomAlert.alert(title, message, buttons, options, "info");
  },
};

export const CustomAlertProvider: React.FC = () => {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    globalSetAlertConfig = (newConfig) => {
      if (newConfig) {
        setConfig(newConfig);
        setVisible(true);
      } else {
        setVisible(false);
        // Delay resetting config for fade out animation
        setTimeout(() => setConfig(null), 200);
      }
    };
    return () => {
      globalSetAlertConfig = null;
    };
  }, []);

  if (!config) return null;

  const handleDismiss = (onPress?: () => void) => {
    setVisible(false);
    setTimeout(() => {
      setConfig(null);
      if (onPress) onPress();
    }, 200);
  };

  // Render proper icon based on type
  const renderIcon = () => {
    const size = 52;
    switch (config.type) {
      case "success":
        return <IoCheckmarkCircleOutline size={size} color="var(--success)" />;
      case "error":
        return <IoCloseCircleOutline size={size} color="var(--danger)" />;
      case "warning":
        return <IoAlertCircleOutline size={size} color="var(--warning)" />;
      case "info":
      default:
        return <IoInformationCircleOutline size={size} color="var(--primary)" />;
    }
  };

  // Default button if none provided
  const buttons = config.buttons && config.buttons.length > 0 
    ? config.buttons 
    : [{ text: "OK" }];

  return createPortal(
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
        transition: "opacity 0.2s ease-out",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
      onClick={() => {
        if (config.options?.cancelable !== false) {
          handleDismiss();
        }
      }}
    >
      <div 
        style={{
          width: "100%",
          maxWidth: "360px",
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--border)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: visible ? "scale(1)" : "scale(0.92)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: "16px" }}>{renderIcon()}</div>
        
        <h3 
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "8px",
            fontFamily: "var(--font-display)",
          }}
        >
          {config.title}
        </h3>
        
        {config.message && (
          <p 
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              marginBottom: "24px",
              whiteSpace: "pre-line",
            }}
          >
            {config.message}
          </p>
        )}

        <div 
          style={{
            display: "flex",
            width: "100%",
            gap: "10px",
            flexDirection: buttons.length > 2 ? "column" : "row",
            justifyContent: "center",
          }}
        >
          {buttons.map((btn, index) => {
            const isDestructive = btn.style === "destructive";
            const isCancel = btn.style === "cancel";
            
            let bg = "var(--primary)";
            let textCol = "#ffffff";
            let border = "none";

            if (isDestructive) {
              bg = "var(--danger)";
            } else if (isCancel) {
              bg = "var(--primary-light)";
              textCol = "var(--primary-dark)";
            }

            return (
              <button
                key={index}
                onClick={() => handleDismiss(btn.onPress)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "14px",
                  fontWeight: 500,
                  backgroundColor: bg,
                  color: textCol,
                  border: border,
                  transition: "all 0.15s ease",
                  minWidth: "100px",
                }}
              >
                {btn.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
