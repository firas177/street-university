"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function NavItem({ label, active, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px 14px",
        borderRadius: "14px",
        border: danger
          ? "1px solid #fecaca"
          : active
          ? "1px solid #bfdbfe"
          : "1px solid #cbd5e1",
        background: danger
          ? "#fff5f5"
          : active
          ? "linear-gradient(135deg, #eff6ff, #ffffff)"
          : "#ffffff",
        color: danger ? "#dc2626" : active ? "#1d4ed8" : "#0f172a",
        cursor: "pointer",
        fontWeight: active || danger ? "700" : "600",
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
  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    const token = localStorage.getItem("token");
    setHasToken(!!token);
    setMounted(true);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setHasToken(false);
    router.replace("/");
  }

  if (!mounted) return null;

  const guestItems = [
    {
      label: "Accueil",
      active: pathname === "/",
      onClick: () => router.push("/"),
    },
    {
      label: "Connexion",
      active: pathname === "/auth/login",
      onClick: () => router.push("/auth/login"),
    },
    {
      label: "Inscription",
      active: pathname === "/auth/register",
      onClick: () => router.push("/auth/register"),
    },
  ];

  const authItems = [
    {
      label: "Accueil",
      active: pathname === "/" || pathname === "/dashboard",
      onClick: () => router.push("/"),
    },
    {
      label: "Profil",
      active: pathname === "/dashboard/profile",
      onClick: () => router.push("/dashboard/profile"),
    },
    {
      label: "Scénarios",
      active: pathname === "/scenarios" || pathname.startsWith("/session/"),
      onClick: () => router.push("/scenarios"),
    },
    {
      label: "Déconnexion",
      active: false,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const items = hasToken ? authItems : guestItems;

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
          onClick={() => router.push(hasToken ? "/scenarios" : "/")}
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
            gridTemplateColumns: isMobile
              ? `repeat(${items.length}, 1fr)`
              : `repeat(${items.length}, auto)`,
            gap: "10px",
            width: isMobile ? "100%" : "auto",
          }}
        >
          {items.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              active={item.active}
              onClick={item.onClick}
              danger={item.danger}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}