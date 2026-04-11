"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import { getMe, getScenarios, getSessions } from "../lib/api";

function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getSessionTimestamp(session) {
  return new Date(
    session?.updated_at || session?.created_at || session?.started_at || 0
  ).getTime();
}

function getRecentSessions(sessions) {
  return [...sessions]
    .sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a))
    .slice(0, 5);
}

function getScenarioTitle(session) {
  return (
    session?.scenario?.title ||
    session?.scenario_title ||
    session?.title ||
    "Simulation sans titre"
  );
}

function getScenarioCategory(session) {
  return session?.scenario?.category || session?.category || "Général";
}

function getStatusVariant(status) {
  if (status === "completed") return "completed";
  return "active";
}

function getStatusLabel(status) {
  if (status === "completed") return "Terminée";
  if (status === "active") return "Active";
  return status || "Inconnue";
}

function PerformanceMiniCard({ label, value }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "20px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748b",
          fontSize: "13px",
          fontWeight: "700",
        }}
      >
        {label}
      </p>
      <h3
        style={{
          margin: "8px 0 0",
          color: "#0f172a",
          fontSize: "24px",
          fontWeight: "800",
          lineHeight: 1.1,
        }}
      >
        {value}
      </h3>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [meData, sessionsData, scenariosData] = await Promise.all([
          getMe(token),
          getSessions(token),
          getScenarios(token),
        ]);

        setUser(meData || null);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setScenarios(Array.isArray(scenariosData) ? scenariosData : []);
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setError(
          err?.message ||
            "Impossible de charger les données du dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (session) => session.status === "completed"
    ).length;
    const activeSessions = sessions.filter(
      (session) => session.status === "active"
    ).length;
    const totalScenarios = scenarios.length;
    const completionRate =
      totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

    const recentSessions = getRecentSessions(sessions);

    const lastSessionDate =
      recentSessions.length > 0
        ? formatDate(
            recentSessions[0]?.updated_at ||
              recentSessions[0]?.created_at ||
              recentSessions[0]?.started_at
          )
        : "N/A";

    return {
      totalSessions,
      completedSessions,
      activeSessions,
      totalScenarios,
      completionRate,
      recentSessions,
      lastSessionDate,
    };
  }, [sessions, scenarios]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <Card
              style={{
                padding: "24px",
                borderRadius: "24px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "28px",
                  fontWeight: "800",
                }}
              >
                Chargement du dashboard...
              </h1>
              <p
                style={{
                  margin: "12px 0 0",
                  color: "#64748b",
                  lineHeight: 1.7,
                  fontSize: "15px",
                }}
              >
                Nous récupérons vos statistiques, vos sessions et vos scénarios.
              </p>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-container">
          {error && (
            <Alert
              type="error"
              message={error}
              style={{ borderRadius: "20px" }}
            />
          )}

          <Card
            style={{
              padding: "30px",
              borderRadius: "30px",
              background:
                "linear-gradient(135deg, #ffffff, #eff6ff 55%, #dbeafe)",
              border: "1px solid #dbeafe",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
              color: "#0f172a",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-30px",
                right: "-30px",
                width: "180px",
                height: "180px",
                borderRadius: "999px",
                background: "rgba(37, 99, 235, 0.08)",
                pointerEvents: "none",
              }}
            />

            <div className="hero-content">
              <div className="hero-text">
                <p className="hero-eyebrow">Dashboard étudiant</p>

                <h1 className="hero-title">
                  Bon retour{user?.full_name ? `, ${user.full_name}` : ""}.
                </h1>

                <p className="hero-description">
                  Suivez votre progression, reprenez rapidement vos simulations
                  récentes et gardez une vision claire de votre évolution sur
                  Street University.
                </p>

                <div className="hero-badges">
                  <Badge variant="info">
                    {stats.totalSessions} session
                    {stats.totalSessions > 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="completed">
                    {stats.completionRate}% de complétion
                  </Badge>
                  <Badge variant="active">
                    Dernière activité : {stats.lastSessionDate}
                  </Badge>
                </div>
              </div>

              <div className="hero-actions">
                <Button onClick={() => router.push("/scenarios")}>
                  Démarrer une simulation
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => router.push("/sessions")}
                >
                  Voir mes sessions
                </Button>
              </div>
            </div>
          </Card>

          <section>
            <SectionHeader
              eyebrow="Vue d’ensemble"
              title="Vos statistiques principales"
              description="Indicateurs calculés à partir de vos sessions réelles et des scénarios disponibles sur la plateforme."
            />

            <div className="stats-grid">
              <StatCard
                label="Total sessions"
                value={stats.totalSessions}
                helpText="Toutes les simulations lancées."
                accent="blue"
              />

              <StatCard
                label="Sessions terminées"
                value={stats.completedSessions}
                helpText="Simulations finalisées avec succès."
                accent="green"
              />

              <StatCard
                label="Sessions actives"
                value={stats.activeSessions}
                helpText="Simulations actuellement en cours."
                accent="amber"
              />

              <StatCard
                label="Scénarios disponibles"
                value={stats.totalScenarios}
                helpText="Scénarios accessibles sur la plateforme."
                accent="slate"
              />

              <StatCard
                label="Taux de complétion"
                value={`${stats.completionRate}%`}
                helpText="Part de sessions terminées."
                accent="blue"
              />

              <StatCard
                label="Dernière session"
                value={stats.lastSessionDate}
                helpText="Date de votre activité la plus récente."
                accent="slate"
              />
            </div>
          </section>

          <div className="dashboard-two-columns">
            <section style={{ minWidth: 0 }}>
              <SectionHeader
                eyebrow="Activité récente"
                title="Sessions récentes"
                description="Reprenez rapidement vos dernières simulations."
              />

              <Card
                style={{
                  padding: "20px",
                  borderRadius: "24px",
                }}
              >
                {stats.recentSessions.length === 0 ? (
                  <Alert
                    type="info"
                    message="Aucune session récente pour le moment. Lance ta première simulation depuis la page Scénarios."
                  />
                ) : (
                  <div className="recent-list">
                    {stats.recentSessions.map((session) => {
                      const scenarioTitle = getScenarioTitle(session);
                      const category = getScenarioCategory(session);
                      const status = session?.status || "active";
                      const sessionId = session?.id;

                      return (
                        <div key={sessionId} className="recent-item">
                          <div className="recent-item-main">
                            <h3 className="recent-item-title">{scenarioTitle}</h3>

                            <p className="recent-item-meta">
                              {category} •{" "}
                              {formatDate(
                                session?.updated_at ||
                                  session?.created_at ||
                                  session?.started_at
                              )}
                            </p>
                          </div>

                          <div className="recent-item-actions">
                            <Badge variant={getStatusVariant(status)}>
                              {getStatusLabel(status)}
                            </Badge>

                            {sessionId && (
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  router.push(`/session/${sessionId}`)
                                }
                              >
                                Reprendre
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </section>

            <section style={{ minWidth: 0 }}>
              <SectionHeader
                eyebrow="Actions rapides"
                title="Accès direct"
                description="Naviguez plus vite dans les zones importantes."
              />

              <div className="quick-actions-stack">
                <Card
                  hoverable
                  style={{
                    padding: "20px",
                    borderRadius: "24px",
                  }}
                >
                  <h3 className="quick-card-title">Démarrer une simulation</h3>
                  <p className="quick-card-text">
                    Lancez un nouveau scénario pour continuer à progresser.
                  </p>
                  <Button onClick={() => router.push("/scenarios")}>
                    Aller aux scénarios
                  </Button>
                </Card>

                <Card
                  hoverable
                  style={{
                    padding: "20px",
                    borderRadius: "24px",
                  }}
                >
                  <h3 className="quick-card-title">Consulter mes sessions</h3>
                  <p className="quick-card-text">
                    Retrouvez vos simulations actives et terminées.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/sessions")}
                  >
                    Ouvrir les sessions
                  </Button>
                </Card>

                <Card
                  hoverable
                  style={{
                    padding: "20px",
                    borderRadius: "24px",
                  }}
                >
                  <h3 className="quick-card-title">Mettre à jour le profil</h3>
                  <p className="quick-card-text">
                    Gérez vos informations et préparez vos prochaines
                    simulations.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/dashboard/profile")}
                  >
                    Ouvrir le profil
                  </Button>
                </Card>
              </div>
            </section>
          </div>

          <section>
            <SectionHeader
              eyebrow="Rating futur"
              title="Aperçu de performance"
              description="Zone préparée pour la future intégration du rating utilisateur et des feedbacks IA."
            />

            <Card
              style={{
                padding: "22px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #ffffff, #f8fbff)",
                border: "1px solid #dbeafe",
                boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
              }}
            >
              <div className="performance-grid">
                <PerformanceMiniCard label="Score global" value="8.2 / 10" />
                <PerformanceMiniCard label="Communication" value="8.0" />
                <PerformanceMiniCard label="Confiance" value="7.0" />
                <PerformanceMiniCard label="Clarté" value="9.0" />
                <PerformanceMiniCard label="Professionnalisme" value="9.0" />
              </div>

              <div className="advice-grid">
                <div className="advice-card advice-blue">
                  <h4 className="advice-title advice-title-blue">
                    Points forts
                  </h4>
                  <p className="advice-text">
                    Bonne clarté, réponses structurées et attitude
                    professionnelle solide.
                  </p>
                </div>

                <div className="advice-card advice-orange">
                  <h4 className="advice-title advice-title-orange">
                    Axes d’amélioration
                  </h4>
                  <p className="advice-text">
                    Renforcer la confiance, la fluidité et la force d’impact
                    dans certaines réponses.
                  </p>
                </div>

                <div className="advice-card advice-green">
                  <h4 className="advice-title advice-title-green">
                    Conseil final
                  </h4>
                  <p className="advice-text">
                    Continuez des simulations régulières pour transformer vos
                    bonnes bases en progression constante.
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background: linear-gradient(
            180deg,
            #f8fbff 0%,
            #eef4ff 45%,
            #ffffff 100%
          );
          padding: 32px 20px 60px;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hero-content {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-text {
          max-width: 760px;
          min-width: 0;
          flex: 1;
        }

        .hero-eyebrow {
          margin: 0;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 10px 0 12px;
          color: #0f172a;
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .hero-description {
          margin: 0;
          color: #334155;
          font-size: 16px;
          line-height: 1.8;
          font-weight: 500;
          max-width: 700px;
        }

        .hero-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .hero-actions {
          min-width: 220px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .dashboard-two-columns {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
          gap: 20px;
          align-items: start;
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 22px;
          border: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #ffffff, #f8fbff);
          flex-wrap: wrap;
        }

        .recent-item-main {
          min-width: 0;
          flex: 1;
        }

        .recent-item-title {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 800;
          line-height: 1.3;
        }

        .recent-item-meta {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 500;
        }

        .recent-item-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .quick-actions-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .quick-card-title {
          margin: 0;
          color: #0f172a;
          font-size: 20px;
          font-weight: 800;
        }

        .quick-card-text {
          margin: 10px 0 16px;
          color: #64748b;
          line-height: 1.7;
          font-size: 14px;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .advice-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .advice-card {
          padding: 18px;
          border-radius: 22px;
        }

        .advice-blue {
          background: linear-gradient(135deg, #eff6ff, #ffffff);
          border: 1px solid #bfdbfe;
        }

        .advice-orange {
          background: linear-gradient(135deg, #fff7ed, #ffffff);
          border: 1px solid #fdba74;
        }

        .advice-green {
          background: linear-gradient(135deg, #f0fdf4, #ffffff);
          border: 1px solid #86efac;
        }

        .advice-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
        }

        .advice-title-blue {
          color: #1d4ed8;
        }

        .advice-title-orange {
          color: #c2410c;
        }

        .advice-title-green {
          color: #166534;
        }

        .advice-text {
          margin: 10px 0 0;
          color: #475569;
          line-height: 1.7;
          font-size: 14px;
        }

        @media (max-width: 960px) {
          .dashboard-two-columns {
            grid-template-columns: 1fr;
          }

          .hero-actions {
            width: 100%;
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .page-shell {
            padding: 20px 12px 40px;
          }

          .page-container {
            gap: 18px;
          }

          .hero-title {
            font-size: 38px;
          }

          .hero-description {
            font-size: 15px;
            line-height: 1.7;
          }

          .stats-grid,
          .performance-grid,
          .advice-grid {
            grid-template-columns: 1fr;
          }

          .recent-item {
            padding: 14px;
          }

          .recent-item-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .quick-card-title {
            font-size: 18px;
          }
        }
      `}</style>
    </>
  );
}