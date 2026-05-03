"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "../lib/api";

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
        <button type="button" className="brand" onClick={handleBrandClick}>
          <span className="brand-mark">SU</span>
          <span>
            <strong>Street University</strong>
            <small>AI-Powered Soft Skills</small>
          </span>
        </button>

        <nav className="nav-links">
          {links.map((link) => {
            const active = pathname === link.path;
            return (
              <button
                key={link.path}
                type="button"
                className={`nav-item${active ? " active" : ""}`}
                onClick={() => router.push(link.path)}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </button>
            );
          })}

          {isAuthenticated && (
            <button type="button" onClick={handleLogout} className="logout-btn">
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
          border-bottom: 1px solid rgba(147, 197, 253, 0.22);
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(3, 7, 18, 0.88) 100%),
            linear-gradient(135deg, rgba(2, 6, 23, 0.65), rgba(15, 23, 42, 0.45));
          backdrop-filter: blur(20px) saturate(1.35);
          -webkit-backdrop-filter: blur(20px) saturate(1.35);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.06) inset,
            0 18px 50px rgba(2, 6, 23, 0.35);
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
          appearance: none;
          font-family: inherit;
          border-radius: 16px;
          padding: 4px 8px 4px 4px;
          margin: -4px;
          transition: background 0.2s ease, box-shadow 0.2s ease;
        }

        .brand:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .brand:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .brand-mark {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(145deg, #3b82f6, #2563eb 40%, #06b6d4);
          color: #ffffff;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.02em;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.2),
            0 12px 28px rgba(37, 99, 235, 0.45),
            0 0 40px rgba(34, 211, 238, 0.2);
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
          color: #dbeafe;
          font-size: 14px;
          line-height: 1.45;
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
          -webkit-appearance: none;
          appearance: none;
          font-family: inherit;
          margin: 0;
          box-sizing: border-box;
          border-style: solid;
          border-width: 1px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 44px;
          border-radius: 999px;
          padding: 10px 18px;
          border-color: rgba(147, 197, 253, 0.28);
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.12) 0%, rgba(30, 58, 138, 0.25) 100%);
          color: #f1f5f9;
          cursor: pointer;
          font-size: 15px;
          line-height: 1.4;
          font-weight: 800;
          text-decoration: none;
          transition:
            transform 0.18s ease,
            background 0.22s ease,
            border-color 0.22s ease,
            box-shadow 0.22s ease,
            color 0.2s ease;
          white-space: nowrap;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.08) inset,
            0 8px 22px rgba(2, 6, 23, 0.35);
        }

        .nav-item::-moz-focus-inner,
        .logout-btn::-moz-focus-inner {
          border: 0;
          padding: 0;
        }

        .nav-item:focus,
        .logout-btn:focus {
          outline: none;
        }

        .nav-item:focus-visible,
        .logout-btn:focus-visible {
          outline: 2px solid #22d3ee;
          outline-offset: 3px;
        }

        .nav-item:hover:not(.active) {
          transform: translateY(-1px);
          border-color: rgba(56, 189, 248, 0.55);
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.16) 0%, rgba(37, 99, 235, 0.28) 100%);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.1) inset,
            0 10px 28px rgba(2, 6, 23, 0.4),
            0 0 24px rgba(34, 211, 238, 0.28),
            0 0 1px rgba(125, 211, 252, 0.8);
          color: #ffffff;
        }

        .nav-item:active:not(.active) {
          transform: translateY(0);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 42%, #7dd3fc 100%);
          color: #0c1222;
          border-color: rgba(255, 255, 255, 0.65);
          font-weight: 900;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.85) inset,
            0 12px 36px rgba(37, 99, 235, 0.35),
            0 0 0 1px rgba(14, 165, 233, 0.35),
            0 0 28px rgba(56, 189, 248, 0.45);
        }

        .nav-item.active:hover {
          transform: translateY(-1px);
          border-color: rgba(14, 165, 233, 0.6);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 14px 40px rgba(37, 99, 235, 0.4),
            0 0 32px rgba(34, 211, 238, 0.4);
        }

        .logout-btn {
          background: linear-gradient(160deg, rgba(127, 29, 29, 0.75) 0%, rgba(30, 10, 10, 0.92) 100%);
          color: #fecaca;
          border-color: rgba(248, 113, 113, 0.5);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.1) inset,
            0 8px 26px rgba(69, 10, 10, 0.55),
            0 0 0 1px rgba(127, 29, 29, 0.4);
        }

        .logout-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(252, 165, 165, 0.85);
          background: linear-gradient(160deg, rgba(185, 28, 28, 0.88) 0%, rgba(69, 10, 10, 0.95) 100%);
          color: #ffffff;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.12) inset,
            0 12px 32px rgba(127, 29, 29, 0.45),
            0 0 20px rgba(248, 113, 113, 0.2);
        }

        .logout-btn:active {
          transform: translateY(0);
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
