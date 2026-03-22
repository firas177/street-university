"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "../../lib/api";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Alert from "../../components/ui/Alert";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const data = await getProfile(token);
        setUser(data);
      } catch (err) {
        setError(err?.message || "Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            padding: isMobile ? "24px 14px" : "40px 20px",
            fontSize: "18px",
            color: "#334155",
          }}
        >
          Chargement du profil...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes softPulse {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
        }
      `}</style>

      <Navbar />

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: isMobile ? "20px 14px 30px" : "32px 20px 40px",
        }}
      >
        <PageHeader
          dark
          badge="Mon profil"
          title={user?.full_name || "Profil utilisateur"}
          description="Voici les informations récupérées depuis ton backend, présentées dans une interface plus moderne et plus claire."
        />

        {error && (
          <Alert type="error" style={{ marginBottom: "18px" }}>
            {error}
          </Alert>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "18px",
              animation: "fadeUp 0.45s ease",
            }}
          >
            <Card
              hoverable
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "28px",
                padding: isMobile ? "22px 18px" : "28px",
                background:
                  "radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 28%), #ffffff",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-35px",
                  right: "-20px",
                  width: "130px",
                  height: "130px",
                  borderRadius: "999px",
                  background: "rgba(37,99,235,0.08)",
                  animation: "softPulse 3.2s ease-in-out infinite",
                }}
              />

              <p
                style={{
                  margin: 0,
                  color: "#2563eb",
                  fontWeight: "700",
                  fontSize: "13px",
                  letterSpacing: "0.03em",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                IDENTITÉ
              </p>

              <h2
                style={{
                  margin: "10px 0 10px",
                  fontSize: isMobile ? "28px" : "34px",
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  color: "#0f172a",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Un aperçu de ton compte.
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  lineHeight: 1.75,
                  fontSize: "15px",
                  maxWidth: "680px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Cette page affiche les données principales de l’utilisateur
                connectée au backend, avec une présentation plus propre et plus
                premium.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: "14px",
                  marginTop: "22px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "18px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      color: "#2563eb",
                      marginBottom: "8px",
                    }}
                  >
                    NOM
                  </div>
                  <div
                    style={{
                      color: "#334155",
                      lineHeight: 1.6,
                      fontSize: "14px",
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.full_name || "Non disponible"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "18px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      color: "#2563eb",
                      marginBottom: "8px",
                    }}
                  >
                    EMAIL
                  </div>
                  <div
                    style={{
                      color: "#334155",
                      lineHeight: 1.6,
                      fontSize: "14px",
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.email || "Non disponible"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "18px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      color: "#2563eb",
                      marginBottom: "8px",
                    }}
                  >
                    IDENTIFIANT
                  </div>
                  <div
                    style={{
                      color: "#334155",
                      lineHeight: 1.6,
                      fontSize: "14px",
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.id || "Non disponible"}
                  </div>
                </div>
              </div>
            </Card>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                gap: "18px",
                animation: "fadeUp 0.55s ease",
              }}
            >
              <Card hoverable style={{ borderRadius: "24px", padding: "22px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    marginBottom: "14px",
                  }}
                >
                  01
                </div>
                <h3
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: "22px",
                    lineHeight: 1.12,
                  }}
                >
                  Compte actif
                </h3>
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#64748b",
                    lineHeight: 1.7,
                    fontSize: "14px",
                  }}
                >
                  Les données affichées viennent de l’utilisateur connecté.
                </p>
              </Card>

              <Card hoverable style={{ borderRadius: "24px", padding: "22px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    marginBottom: "14px",
                  }}
                >
                  02
                </div>
                <h3
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: "22px",
                    lineHeight: 1.12,
                  }}
                >
                  Accès sécurisé
                </h3>
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#64748b",
                    lineHeight: 1.7,
                    fontSize: "14px",
                  }}
                >
                  Sans token, la page redirige automatiquement vers login.
                </p>
              </Card>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "18px",
              animation: "fadeUp 0.65s ease",
            }}
          >
            <Card
              hoverable
              style={{
                borderRadius: "28px",
                padding: isMobile ? "22px 18px" : "26px",
                background:
                  "linear-gradient(135deg, rgba(239,246,255,1), rgba(255,255,255,1))",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#2563eb",
                  fontWeight: "700",
                  fontSize: "13px",
                  letterSpacing: "0.03em",
                }}
              >
                DÉTAILS
              </p>

              <h2
                style={{
                  margin: "10px 0 18px",
                  color: "#0f172a",
                  fontSize: isMobile ? "24px" : "28px",
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                }}
              >
                Informations principales
              </h2>

              <div style={{ display: "grid", gap: "12px" }}>
                <div
                  style={{
                    padding: "15px",
                    borderRadius: "18px",
                    background: "#ffffff",
                    border: "1px solid #dbeafe",
                    boxShadow: "0 8px 18px rgba(37,99,235,0.06)",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Nom complet</strong>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#475569",
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.full_name || "Non disponible"}
                  </p>
                </div>

                <div
                  style={{
                    padding: "15px",
                    borderRadius: "18px",
                    background: "#ffffff",
                    border: "1px solid #dbeafe",
                    boxShadow: "0 8px 18px rgba(37,99,235,0.06)",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Adresse email</strong>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#475569",
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.email || "Non disponible"}
                  </p>
                </div>

                <div
                  style={{
                    padding: "15px",
                    borderRadius: "18px",
                    background: "#ffffff",
                    border: "1px solid #dbeafe",
                    boxShadow: "0 8px 18px rgba(37,99,235,0.06)",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>ID utilisateur</strong>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#475569",
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {user?.id || "Non disponible"}
                  </p>
                </div>
              </div>
            </Card>

            <Card
              hoverable
              style={{
                borderRadius: "28px",
                padding: isMobile ? "22px 18px" : "26px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "10px",
                  color: "#0f172a",
                  fontSize: "24px",
                  lineHeight: 1.1,
                }}
              >
                Actions rapides
              </h3>

              <p
                style={{
                  marginTop: 0,
                  color: "#64748b",
                  lineHeight: 1.7,
                  fontSize: "14px",
                }}
              >
                Navigue rapidement entre le dashboard, ton profil et la
                déconnexion.
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                <Button
                  variant="blue"
                  onClick={() => router.push("/dashboard")}
                  fullWidth
                >
                  Retour au dashboard
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => router.push("/scenarios")}
                  fullWidth
                >
                  Aller aux scénarios
                </Button>

                <Button
                  variant="danger"
                  onClick={handleLogout}
                  fullWidth
                >
                  Déconnexion
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}