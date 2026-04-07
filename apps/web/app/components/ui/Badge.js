"use client";

export default function Badge({
  children,
  variant = "default",
  style = {},
}) {
  const variants = {
    default: {
      background: "#f8fafc",
      color: "#334155",
      border: "1px solid #e2e8f0",
      boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
    },
    active: {
      background: "linear-gradient(135deg, #fef3c7, #fffbeb)",
      color: "#92400e",
      border: "1px solid #fcd34d",
      boxShadow: "0 8px 18px rgba(245,158,11,0.10)",
    },
    completed: {
      background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
      color: "#166534",
      border: "1px solid #86efac",
      boxShadow: "0 8px 18px rgba(22,163,74,0.10)",
    },
    info: {
      background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
      boxShadow: "0 8px 18px rgba(37,99,235,0.10)",
    },
  };

  const current = variants[variant] || variants.default;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "7px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "700",
        lineHeight: 1,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        ...current,
        ...style,
      }}
    >
      {children}
    </span>
  );
}