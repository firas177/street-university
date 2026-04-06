"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { getSessions } from "../lib/api";

export default function SessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        const data = await getSessions(token);
        setSessions(data);
      } catch (err) {
        setError(err.message || "Erreur lors du chargement des sessions");
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";

    try {
      return new Date(dateString).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
      }}
    >
      <Navbar />

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Mes sessions
          </h1>

          <p
            style={{
              color: "#475569",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Retrouvez vos anciennes simulations et reprenez votre progression à tout moment.
          </p>
        </div>

        {loading && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "24px",
              color: "#334155",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
            }}
          >
            Chargement des sessions...
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "20px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "24px",
              color: "#475569",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
            }}
          >
            Aucune session trouvée pour le moment.
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "24px",
                  padding: "22px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <h2
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: "#0f172a",
                        marginBottom: "8px",
                      }}
                    >
                      {session?.scenario?.title || "Session sans titre"}
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "12px",
                      }}
                    >
                      <span
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {session?.scenario?.category || "Sans catégorie"}
                      </span>

                      <span
                        style={{
                          background: "#f8fafc",
                          color: "#334155",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {session?.status || "unknown"}
                      </span>
                    </div>

                    <p
                      style={{
                        color: "#475569",
                        marginBottom: "10px",
                        lineHeight: 1.6,
                      }}
                    >
                      {session?.scenario?.description || "Aucune description disponible."}
                    </p>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.92rem",
                        margin: 0,
                      }}
                    >
                      Créée le : {formatDate(session.created_at)}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/session/${session.id}`)}
                    style={{
                      border: "none",
                      borderRadius: "14px",
                      padding: "12px 18px",
                      background: "#0f172a",
                      color: "#ffffff",
                      fontWeight: 700,
                      cursor: "pointer",
                      minWidth: "140px",
                    }}
                  >
                    Reprendre
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}