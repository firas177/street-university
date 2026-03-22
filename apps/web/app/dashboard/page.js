"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { getProfile } from "../lib/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import PageHeader from "../components/ui/PageHeader";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    async function loadDashboard() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const data = await getProfile(token);
        setUser(data);
      } catch (err) {
        setError(err?.message || "Impossible de charger le dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
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
            maxWidth: "1150px",
            margin: "0 auto",
            padding: isMobile ? "24px 14px" : "40px 20px",
            color: "#334155",
            fontSize: "18px",
          }}
        >
          Chargement du dashboard...
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

        @keyframes pulseGlow {
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
          maxWidth: "1150px",
          margin: "0 auto",
          padding: isMobile ? "20px 14px 28px" : "32px 20px 40px",
        }}
      >
        <PageHeader
          dark
          badge="Street University Dashboard"
          title={`Bienvenue ${user?.full_name || "utilisateur"}`}
          description="Une plateforme pensée pour apprendre par la pratique, développer sa présence, sa communication et sa confiance dans des situations réelles."
        />

        {error && (
          <Alert type="error" style={{ marginBottom: "18px" }}>
            {error}
          </Alert>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
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
                  top: "-30px",
                  right: "-20px",
                  width: "120px",
                  height: "120px",
                  borderRadius: "999px",
                  background: "rgba(37,99,235,0.08)",
                  animation: "pulseGlow 3s ease-in-out infinite",
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
                NOTRE MISSION
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
                Apprendre ce que l’école n’enseigne pas toujours.
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  lineHeight: 1.75,
                  fontSize: "15px",
                  maxWidth: "720px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Street University aide les jeunes à développer des compétences
                concrètes grâce à des simulations modernes : entretien
                d’embauche, leadership, communication, présence, pitch,
                négociation et préparation aux situations réelles.
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
                    ENTRETIENS
                  </div>
                  <div
                    style={{
                      color: "#334155",
                      lineHeight: 1.6,
                      fontSize: "14px",
                    }}
                  >
                    Prépare-toi à répondre avec plus de clarté, d’impact et de
                    confiance.
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
                    LEADERSHIP
                  </div>
                  <div
                    style={{
                      color: "#334155",
                      lineHeight: 1.6,
                      fontSize: "14px",
                    }}
                  >
                    Développe ta prise de parole, ta présence et ta capacité à
                    convaincre.
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
                    IA & VOIX
                  </div>
                  <div
                    style={{
                      color: "#334155",
                      lineHeight: 1.6,
                      fontSize: "14px",
                    }}
                  >
                    Une base prête pour évoluer vers des sessions vocales et des
                    simulations plus immersives.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "12px",
                  marginTop: "24px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Button
                  variant="blue"
                  onClick={() => router.push("/auth/register")}
                  fullWidth={isMobile}
                >
                  Commencer maintenant
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => router.push("/scenarios")}
                  fullWidth={isMobile}
                >
                  Découvrir les scénarios
                </Button>
              </div>
            </Card>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
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
                  Pratique réelle
                </h3>
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#64748b",
                    lineHeight: 1.7,
                    fontSize: "14px",
                  }}
                >
                  Une plateforme conçue pour passer de la théorie à la mise en
                  situation concrète.
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
                  Progression personnelle
                </h3>
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#64748b",
                    lineHeight: 1.7,
                    fontSize: "14px",
                  }}
                >
                  L’objectif est d’aider chaque utilisateur à gagner en aisance,
                  en structure et en confiance.
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
                  03
                </div>
                <h3
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: "22px",
                    lineHeight: 1.12,
                  }}
                >
                  Expérience moderne
                </h3>
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#64748b",
                    lineHeight: 1.7,
                    fontSize: "14px",
                  }}
                >
                  Une interface claire et évolutive, pensée pour devenir une
                  vraie plateforme d’apprentissage assistée par l’IA.
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
                POURQUOI S’INSCRIRE ?
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
                Ce que la plateforme apporte
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
                  <strong style={{ color: "#0f172a" }}>
                    Simulations inspirées du réel
                  </strong>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    Prépare-toi à des contextes concrets comme les entretiens,
                    les prises de parole et les pitchs.
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
                  <strong style={{ color: "#0f172a" }}>
                    Développement des soft skills
                  </strong>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    Travaille la communication, la confiance, le leadership et
                    la manière de te présenter.
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
                  <strong style={{ color: "#0f172a" }}>
                    Évolution IA et voix
                  </strong>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    Le projet est construit pour aller vers des interactions plus
                    intelligentes et plus immersives.
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
                Commence à découvrir la plateforme, consulte ton profil ou passe
                directement aux prochaines étapes.
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
                  onClick={() => router.push("/dashboard/profile")}
                  fullWidth
                >
                  Ouvrir le profil
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => router.push("/scenarios")}
                  fullWidth
                >
                  Voir les scénarios
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