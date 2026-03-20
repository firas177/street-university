export default function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "22px",
        padding: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}