export default function Alert({ children, type = "error", style = {} }) {
  const variants = {
    error: {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    },
    success: {
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
    },
    warning: {
      background: "#fff7ed",
      color: "#9a3412",
      border: "1px solid #fdba74",
    },
    info: {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    },
  };

  return (
    <div
      style={{
        padding: "13px 14px",
        borderRadius: "14px",
        fontSize: "14px",
        lineHeight: 1.5,
        ...variants[type],
        ...style,
      }}
    >
      {children}
    </div>
  );
}