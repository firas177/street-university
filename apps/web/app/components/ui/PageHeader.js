"use client";

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
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 32%), linear-gradient(135deg, #0f172a, #1e293b)",
          color: "#ffffff",
          borderRadius: "30px",
          padding: "34px",
          marginBottom: "24px",
          boxShadow: "0 22px 44px rgba(15,23,42,0.18)",
          position: "relative",
          overflow: "hidden",
          animation: "headerFade 0.45s ease",
          ...style,
        }}
      >
        <style jsx>{`
          @keyframes headerFade {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "180px",
            height: "180px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.06)",
          }}
        />

        {badge && (
          <p
            style={{
              margin: 0,
              display: "inline-flex",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              opacity: 0.95,
              fontSize: "13px",
              fontWeight: "700",
              position: "relative",
              zIndex: 1,
            }}
          >
            {badge}
          </p>
        )}

        <h1
          style={{
            margin: "14px 0 10px",
            fontSize: "40px",
            fontWeight: "800",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            position: "relative",
            zIndex: 1,
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            style={{
              margin: 0,
              opacity: 0.9,
              maxWidth: "720px",
              lineHeight: 1.7,
              fontSize: "16px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {description}
          </p>
        )}
      </section>
    );
  }

  return (
    <div
      style={{
        marginBottom: "24px",
        animation: "headerFade 0.45s ease",
        ...style,
      }}
    >
      <style jsx>{`
        @keyframes headerFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {badge && (
        <span
          style={{
            display: "inline-block",
            padding: "7px 13px",
            borderRadius: "999px",
            background: "#eff6ff",
            color: "#1d4ed8",
            fontSize: "13px",
            fontWeight: "700",
            marginBottom: "14px",
            boxShadow: "0 6px 16px rgba(37,99,235,0.08)",
          }}
        >
          {badge}
        </span>
      )}

      <h1
        style={{
          fontSize: "38px",
          margin: 0,
          color: "#0f172a",
          fontWeight: "800",
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
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
            lineHeight: 1.7,
            maxWidth: "720px",
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}