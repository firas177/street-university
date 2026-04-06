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
          : hovered
          ? "#f8fafc"
          : "#ffffff",
        color: active ? "#1d4ed8" : "#0f172a",
        cursor: "pointer",
        fontWeight: active ? "700" : "600",
        transition: "all 0.2s ease",
        boxShadow: hovered ? "0 8px 20px rgba(15, 23, 42, 0.06)" : "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/auth/login");
  };

  if (!mounted) return null;

  const guestLinks = [
    { label: "Accueil", path: "/" },
    { label: "Connexion", path: "/auth/login" },
    { label: "Inscription", path: "/auth/register" },
  ];

  const authLinks = [
    { label: "Accueil", path: "/" },
    { label: "Scénarios", path: "/scenarios" },
    { label: "Mes sessions", path: "/sessions" },
    { label: "Profil", path: "/dashboard/profile" },
  ];

  const links = isAuthenticated ? authLinks : guestLinks;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        background: "rgba(255,255,255,0.85)",
        borderBottom: "1px solid rgba(226,232,240,0.9)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div
          onClick={() => router.push(isAuthenticated ? "/scenarios" : "/")}
          style={{
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.1,
            }}
          >
            Street University
          </span>
          <span
            style={{
              fontSize: "0.82rem",
              color: "#475569",
              lineHeight: 1.1,
            }}
          >
            AI-Powered Soft Skills
          </span>
        </div>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {links.map((link) => (
            <NavItem
              key={link.path}
              label={link.label}
              active={pathname === link.path}
              onClick={() => router.push(link.path)}
            />
          ))}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 14px",
                borderRadius: "14px",
                border: "1px solid #fecaca",
                background: "#fff1f2",
                color: "#b91c1c",
                cursor: "pointer",
                fontWeight: 700,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              Déconnexion
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}