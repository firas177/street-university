"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function NavItem({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px 14px",
        borderRadius: "14px",
        border: active ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
        background: active
          ? "linear-gradient(135deg, #eff6ff, #ffffff)"
          : "#ffffff",
        color: active ? "#1d4ed8" : "#0f172a",
        cursor: "pointer",
        fontWeight: active ? "700" : "600",
        width: "100%",
        transition: "all 0.2s ease",
        boxShadow: hovered
          ? "0 10px 22px rgba(15,23,42,0.08)"
          : "0 4px 12px rgba(15,23,42,0.03)",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {label}
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav
      style={{
        width: "100%",
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: isMobile ? "14px" : "16px 20px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div
          onClick={() => router.push("/dashboard")}
          style={{
            fontWeight: "800",
            fontSize: isMobile ? "22px" : "20px",
            color: "#0f172a",
            cursor: "pointer",
            textAlign: isMobile ? "center" : "left",
            letterSpacing: "-0.03em",
          }}
        >
          Street University
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "repeat(3, auto)",
            gap: "10px",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <NavItem
            label="Dashboard"
            active={pathname === "/dashboard"}
            onClick={() => router.push("/dashboard")}
          />

          <NavItem
            label="Profil"
            active={pathname === "/dashboard/profile"}
            onClick={() => router.push("/dashboard/profile")}
          />

          <NavItem
            label="Scénarios"
            active={pathname === "/scenarios"}
            onClick={() => router.push("/scenarios")}
          />
        </div>
      </div>
    </nav>
  );
}