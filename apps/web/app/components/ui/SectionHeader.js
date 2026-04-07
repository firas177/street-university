"use client";

export default function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  style = {},
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "16px",
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <p
            style={{
              margin: "0 0 8px",
              color: "#2563eb",
              fontSize: "13px",
              fontWeight: "800",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </p>
        )}

        <h2
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "24px",
            lineHeight: 1.15,
            fontWeight: "800",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.65,
              maxWidth: "680px",
              fontWeight: "500",
            }}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {action}
        </div>
      )}
    </div>
  );
}