"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: "12px",
        border: active ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
        background: active ? "#eff6ff" : "#ffffff",
        color: active ? "#1d4ed8" : "#0f172a",
        cursor: "pointer",
        fontWeight: active ? "700" : "600",
        width: "100%",
        transition: "all 0.2s ease",
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
        borderBottom: "1px solid #e2e8f0",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
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
            letterSpacing: "-0.02em",
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