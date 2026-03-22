"use client";

import { useState } from "react";

export default function Card({ children, style = {}, hoverable = false }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.96)",
        borderRadius: "24px",
        padding: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: hovered
          ? "0 20px 40px rgba(15,23,42,0.1)"
          : "0 10px 28px rgba(15,23,42,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
        backdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}