export default function PageHeader({
  badge,
  title,
  description,
  dark = false,
  style = {},
}) {
  if (dark) {
    return (
      <section
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          color: "#ffffff",
          borderRadius: "28px",
          padding: "32px",
          marginBottom: "24px",
          boxShadow: "0 20px 40px rgba(15,23,42,0.18)",
          ...style,
        }}
      >
        {badge && (
          <p
            style={{
              margin: 0,
              opacity: 0.85,
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {badge}
          </p>
        )}

        <h1
          style={{
            margin: "10px 0 8px",
            fontSize: "38px",
            fontWeight: "800",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            style={{
              margin: 0,
              opacity: 0.9,
              maxWidth: "700px",
              lineHeight: 1.6,
              fontSize: "16px",
            }}
          >
            {description}
          </p>
        )}
      </section>
    );
  }

  return (
    <div style={{ marginBottom: "24px", ...style }}>
      {badge && (
        <span
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "999px",
            background: "#eff6ff",
            color: "#1d4ed8",
            fontSize: "13px",
            fontWeight: "700",
            marginBottom: "14px",
          }}
        >
          {badge}
        </span>
      )}

      <h1
        style={{
          fontSize: "36px",
          margin: 0,
          color: "#0f172a",
          fontWeight: "800",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h1>

      {description && (
        <p
          style={{
            marginTop: "10px",
            color: "#64748b",
            fontSize: "16px",
            lineHeight: 1.6,
            maxWidth: "720px",
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}