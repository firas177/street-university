"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "../lib/api";

function NavItem({ label, active, onClick }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    async function loadNavbarState() {
      setMounted(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setUserRole(null);
        return;
      }

      setIsAuthenticated(true);

      try {
        const me = await getMe(token);
        setUserRole(me?.role || null);
      } catch {
        setUserRole(null);
      }
    }

    loadNavbarState();
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

  const userLinks = [
    { label: "Accueil", path: "/dashboard" },
    { label: "Scénarios", path: "/scenarios" },
    { label: "Mes sessions", path: "/sessions" },
    { label: "Profil", path: "/dashboard/profile" },
  ];

  const adminLinks = [
    { label: "Dashboard admin", path: "/dashboard/admin" },
    { label: "Scénarios admin", path: "/dashboard/admin/scenarios" },
    { label: "Utilisateurs", path: "/dashboard/admin/users" },
    { label: "Offres", path: "/pricing" },
  ];

  let links = guestLinks;

  if (isAuthenticated && userRole === "admin") {
    links = adminLinks;
  } else if (isAuthenticated) {
    links = userLinks;
  }

  const handleBrandClick = () => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (userRole === "admin") {
      router.push("/dashboard/admin");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <header className="nav-shell">
      <div className="nav-inner">
        <button className="brand" onClick={handleBrandClick}>
          <span className="brand-mark">SU</span>
          <span>
            <strong>Street University</strong>
            <small>AI-Powered Soft Skills</small>
          </span>
        </button>

        <nav className="nav-links">
          {links.map((link) => (
            <NavItem
              key={link.path}
              label={link.label}
              active={pathname === link.path}
              onClick={() => router.push(link.path)}
            />
          ))}

          {isAuthenticated && (
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
          )}
        </nav>
      </div>

      <style jsx>{`
        .nav-shell {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(147, 197, 253, 0.18);
          background:
            linear-gradient(135deg, rgba(3, 7, 18, 0.86), rgba(15, 23, 42, 0.76)),
            rgba(15, 23, 42, 0.82);
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 50px rgba(2, 6, 23, 0.22);
        }

        .nav-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .brand {
          border: 0;
          background: transparent;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-align: left;
          min-width: 230px;
        }

        .brand-mark {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb, #22d3ee);
          color: #ffffff;
          font-size: 13px;
          font-weight: 950;
          box-shadow: 0 16px 34px rgba(37, 99, 235, 0.24);
        }

        .brand strong {
          display: block;
          color: #ffffff;
          font-size: 17px;
          line-height: 1.2;
          font-weight: 950;
        }

        .brand small {
          display: block;
          margin-top: 3px;
          color: #bfdbfe;
          font-size: 13px;
          line-height: 1.3;
          font-weight: 650;
        }

        .nav-links {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .nav-item,
        .logout-btn {
          min-height: 40px;
          border-radius: 999px;
          padding: 9px 13px;
          border: 1px solid rgba(147, 197, 253, 0.2);
          background: rgba(255, 255, 255, 0.08);
          color: #e0f2fe;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.3;
          font-weight: 850;
          transition: transform 0.18s ease, background 0.2s ease, border-color 0.2s ease;
          white-space: nowrap;
        }

        .nav-item:hover,
        .logout-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(34, 211, 238, 0.55);
          background: rgba(96, 165, 250, 0.16);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #ffffff, #bfdbfe);
          color: #0f172a;
          border-color: transparent;
        }

        .logout-btn {
          background: rgba(127, 29, 29, 0.3);
          color: #fecaca;
          border-color: rgba(252, 165, 165, 0.35);
        }

        @media (max-width: 860px) {
          .nav-inner {
            align-items: flex-start;
            flex-direction: column;
          }

          .nav-links {
            width: 100%;
            justify-content: flex-start;
          }
        }

        @media (max-width: 520px) {
          .nav-inner {
            padding: 12px;
          }

          .brand {
            min-width: 0;
          }

          .nav-links {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .nav-item,
          .logout-btn {
            width: 100%;
            white-space: normal;
          }
        }
      `}</style>
    </header>
  );
}
