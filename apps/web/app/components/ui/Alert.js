"use client";

export default function Alert({ children, type = "error", style = {} }) {
  const variants = {
    error: {
      background: "linear-gradient(135deg, #fef2f2, #fff5f5)",
      color: "#b91c1c",
      border: "1px solid #fecaca",
      shadow: "0 8px 20px rgba(220,38,38,0.08)",
    },
    success: {
      background: "linear-gradient(135deg, #f0fdf4, #f7fee7)",
      color: "#166534",
      border: "1px solid #bbf7d0",
      shadow: "0 8px 20px rgba(22,163,74,0.08)",
    },
    warning: {
      background: "linear-gradient(135deg, #fff7ed, #fffbeb)",
      color: "#9a3412",
      border: "1px solid #fdba74",
      shadow: "0 8px 20px rgba(234,88,12,0.08)",
    },
    info: {
      background: "linear-gradient(135deg, #eff6ff, #f8fbff)",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
      shadow: "0 8px 20px rgba(37,99,235,0.08)",
    },
  };

  const current = variants[type];

  return (
    <div
      style={{
        padding: "13px 14px",
        borderRadius: "16px",
        fontSize: "14px",
        lineHeight: 1.55,
        fontWeight: "600",
        boxShadow: current.shadow,
        animation: "fadeSlideIn 0.35s ease",
        ...current,
        ...style,
      }}
    >
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {children}
    </div>
  );
}