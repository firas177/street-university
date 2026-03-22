"use client";

import { useState } from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
  style = {},
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const variants = {
    primary: {
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      color: "#ffffff",
      border: "none",
      shadow: "0 10px 24px rgba(15,23,42,0.18)",
      hoverShadow: "0 14px 30px rgba(15,23,42,0.24)",
    },
    secondary: {
      background: "#ffffff",
      color: "#0f172a",
      border: "1px solid #cbd5e1",
      shadow: "0 6px 18px rgba(15,23,42,0.06)",
      hoverShadow: "0 10px 24px rgba(15,23,42,0.1)",
    },
    danger: {
      background: "linear-gradient(135deg, #fee2e2, #fff1f2)",
      color: "#b91c1c",
      border: "1px solid #fecaca",
      shadow: "0 8px 18px rgba(220,38,38,0.08)",
      hoverShadow: "0 12px 24px rgba(220,38,38,0.14)",
    },
    blue: {
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#ffffff",
      border: "none",
      shadow: "0 10px 24px rgba(37,99,235,0.22)",
      hoverShadow: "0 14px 30px rgba(37,99,235,0.3)",
    },
  };

  const current = variants[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: fullWidth ? "100%" : "auto",
        boxSizing: "border-box",
        minHeight: "50px",
        padding: "12px 18px",
        borderRadius: "16px",
        fontWeight: "700",
        fontSize: "15px",
        lineHeight: 1.2,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "8px",
        whiteSpace: "nowrap",
        transition: "transform 0.18s ease, box-shadow 0.22s ease, opacity 0.2s ease, filter 0.2s ease",
        transform: disabled
          ? "none"
          : pressed
          ? "translateY(1px) scale(0.99)"
          : hovered
          ? "translateY(-2px)"
          : "translateY(0)",
        boxShadow: hovered ? current.hoverShadow : current.shadow,
        filter: hovered && !disabled ? "brightness(1.02)" : "none",
        ...current,
        ...style,
      }}
    >
      {children}
    </button>
  );
}