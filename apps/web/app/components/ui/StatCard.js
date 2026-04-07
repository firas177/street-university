"use client";

import Card from "./Card";

export default function StatCard({
  label,
  value,
  helpText,
  accent = "blue",
  style = {},
}) {
  const accents = {
    blue: {
      pillBackground: "linear-gradient(135deg, #dbeafe, #eff6ff)",
      pillColor: "#1d4ed8",
      pillBorder: "1px solid #bfdbfe",
    },
    green: {
      pillBackground: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
      pillColor: "#166534",
      pillBorder: "1px solid #86efac",
    },
    amber: {
      pillBackground: "linear-gradient(135deg, #fef3c7, #fffbeb)",
      pillColor: "#92400e",
      pillBorder: "1px solid #fcd34d",
    },
    slate: {
      pillBackground: "linear-gradient(135deg, #e2e8f0, #f8fafc)",
      pillColor: "#334155",
      pillBorder: "1px solid #cbd5e1",
    },
  };

  const current = accents[accent] || accents.blue;

  return (
    <Card
      hoverable
      style={{
        padding: "20px",
        borderRadius: "24px",
        minHeight: "150px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...style,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "42px",
          height: "42px",
          borderRadius: "14px",
          fontWeight: "800",
          fontSize: "14px",
          background: current.pillBackground,
          color: current.pillColor,
          border: current.pillBorder,
          boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
        }}
      >
        •
      </div>

      <div style={{ marginTop: "18px" }}>
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "14px",
            fontWeight: "600",
            lineHeight: 1.5,
          }}
        >
          {label}
        </p>

        <h3
          style={{
            margin: "8px 0 6px",
            fontSize: "34px",
            lineHeight: 1,
            fontWeight: "800",
            color: "#0f172a",
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </h3>

        {helpText && (
          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: "13px",
              lineHeight: 1.55,
              fontWeight: "600",
            }}
          >
            {helpText}
          </p>
        )}
      </div>
    </Card>
  );
}