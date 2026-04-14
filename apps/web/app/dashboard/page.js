"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import {
  getDashboardPerformance,
  getMe,
  getScenarios,
  getSessions,
} from "../lib/api";

function formatDate(value) {
  if (!value) return "Date inconnue";

  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Date inconnue";
  }
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  return `${num.toFixed(1)} / 10`;
}

function formatMetric(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  return num.toFixed(1);
}

function pickValue(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return null;
}

function sanitizeFeedbackText(value, fallback) {
  if (!value || typeof value !== "string") return fallback;

  const lower = value.toLowerCase();

  if (
    lower.includes("unknown request url") ||
    lower.includes("invalid_request_error") ||
    lower.includes("erreur ia") ||
    lower.includes('"error"') ||
    lower.includes("404") ||
    lower.includes("/openai/v1") ||
    lower.includes("groq")
  ) {
    return fallback;
  }

  return value;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        setLoading(true);
        setError("");

        const [meData, sessionsData, scenariosData, performanceData] =
          await Promise.all([
            getMe(token),
            getSessions(token),
            getScenarios(token),
            getDashboardPerformance(token).catch(() => null),
          ]);

        setUser(meData || null);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setScenarios(Array.isArray(scenariosData) ? scenariosData : []);
        setPerformance(performanceData || null);
      } catch (err) {
        setError(err?.message || "Impossible de charger le dashboard.");
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
    const availableScenarios = scenarios.length;
    const completionRate =
      totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

    return {
      totalSessions,
      completedSessions,
      activeSessions,
      availableScenarios,
      completionRate,
    };
  }, [sessions, scenarios]);

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 5);
  }, [sessions]);

  const latestDate =
    recentSessions.length > 0 ? recentSessions[0]?.created_at : null;

  const completedRatedSessions =
    pickValue(
      performance?.completed_rated_sessions,
      performance?.rated_sessions,
      performance?.sessions_evaluees,
      performance?.evaluated_sessions
    ) ?? 0;

  const averageScore = pickValue(
    performance?.average_score,
    performance?.averageScore,
    performance?.avg_score,
    performance?.score_average,
    performance?.moyenne_score
  );

  const bestScore = pickValue(
    performance?.best_score,
    performance?.bestScore,
    performance?.max_score,
    performance?.top_score,
    performance?.meilleur_score
  );

  const communicationAverage = pickValue(
    performance?.communication_average,
    performance?.communication,
    performance?.avg_communication,
    performance?.communication_score
  );

  const confidenceAverage = pickValue(
    performance?.confidence_average,
    performance?.confidence,
    performance?.avg_confidence,
    performance?.confidence_score
  );

  const clarityAverage = pickValue(
    performance?.clarity_average,
    performance?.clarity,
    performance?.avg_clarity,
    performance?.clarity_score
  );

  const relevanceAverage = pickValue(
    performance?.relevance_average,
    performance?.relevance,
    performance?.avg_relevance,
    performance?.relevance_score
  );

  const professionalismAverage = pickValue(
    performance?.professionalism_average,
    performance?.professionalism,
    performance?.avg_professionalism,
    performance?.professionalism_score
  );

  const rawFeedback =
    performance?.latest_feedback ||
    performance?.latestFeedback ||
    performance?.feedback ||
    null;

  const latestFeedback = rawFeedback
    ? {
        strengths: sanitizeFeedbackText(
          rawFeedback?.strengths,
          "Feedback indisponible pour le moment."
        ),
        weaknesses: sanitizeFeedbackText(
          rawFeedback?.weaknesses,
          "Feedback temporairement indisponible."
        ),
        final_advice: sanitizeFeedbackText(
          rawFeedback?.final_advice,
          "Réessayez plus tard ou vérifiez la configuration IA."
        ),
      }
    : null;

  const hasPerformance = completedRatedSessions > 0;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <Card style={{ padding: "28px", borderRadius: "28px" }}>
              <p className="eyebrow">Dashboard étudiant</p>
              <h1 className="hero-title">Chargement du dashboard...</h1>
              <p className="hero-text">
                Nous préparons vos statistiques, scénarios et sessions récentes.
              </p>
            </Card>
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
          }

          .eyebrow {
            margin: 0;
            color: #2563eb;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .hero-title {
            margin: 12px 0 10px;
            color: #0f172a;
            font-size: clamp(30px, 4vw, 46px);
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -0.04em;
          }

          .hero-text {
            margin: 0;
            color: #64748b;
            font-size: 16px;
            line-height: 1.8;
            font-weight: 500;
            max-width: 700px;
          }
        `}</style>
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
              type="warning"
              style={{ marginBottom: "18px", borderRadius: "18px" }}
            >
              {error}
            </Alert>
          )}

          <Card
            style={{
              padding: "32px",
              borderRadius: "30px",
              background:
                "linear-gradient(135deg, #ffffff, #eff6ff 50%, #dbeafe)",
              border: "1px solid #dbeafe",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
              marginBottom: "24px",
            }}
          >
            <div className="hero-row">
              <div className="hero-main">
                <p className="eyebrow">Dashboard étudiant</p>
                <h1 className="hero-title">
                  Bon retour, {user?.full_name || "utilisateur"}.
                </h1>
                <p className="hero-text">
                  Suivez votre progression, reprenez rapidement vos simulations
                  récentes et gardez une vision claire de votre évolution sur
                  Street University.
                </p>

                <div className="hero-badges">
                  <span className="badge badge-blue">
                    {stats.totalSessions} sessions
                  </span>
                  <span className="badge badge-green">
                    {stats.completionRate}% de complétion
                  </span>
                  <span className="badge badge-amber">
                    Dernière activité :{" "}
                    {latestDate ? formatDate(latestDate) : "Aucune"}
                  </span>
                </div>
              </div>

              <div className="hero-actions">
                <button
                  onClick={() => router.push("/scenarios")}
                  className="hero-button primary"
                >
                  Démarrer une simulation
                </button>

                <button
                  onClick={() => router.push("/sessions")}
                  className="hero-button secondary"
                >
                  Voir mes sessions
                </button>

                <button
                  onClick={() => router.push("/dashboard/performance")}
                  className="hero-button secondary"
                >
                  Voir mes performances
                </button>
              </div>
            </div>
          </Card>

          <section style={{ marginBottom: "24px" }}>
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
                value={stats.availableScenarios}
                helpText="Scénarios accessibles sur la plateforme."
                accent="slate"
              />
              <StatCard
                label="Taux de complétion"
                value={`${stats.completionRate}%`}
                helpText="Part de sessions terminées."
                accent="blue"
              />
            </div>
          </section>

          <section style={{ marginBottom: "24px" }}>
            <SectionHeader
              eyebrow="Performance réelle"
              title="Vos performances intelligentes"
              description="Aperçu rapide des scores calculés à partir de vos sessions évaluées."
            />

            {!hasPerformance ? (
              <Card style={{ padding: "24px", borderRadius: "24px" }}>
                <p className="empty-text">
                  Aucune performance réelle n’est encore disponible. Termine une
                  session évaluée pour voir apparaître tes scores et ton
                  feedback IA.
                </p>
              </Card>
            ) : (
              <>
                <div className="stats-grid" style={{ marginBottom: "18px" }}>
                  <StatCard
                    label="Score moyen"
                    value={formatScore(averageScore)}
                    helpText="Moyenne des sessions évaluées."
                    accent="blue"
                  />
                  <StatCard
                    label="Meilleur score"
                    value={formatScore(bestScore)}
                    helpText="Votre meilleure performance."
                    accent="green"
                  />
                  <StatCard
                    label="Sessions évaluées"
                    value={completedRatedSessions}
                    helpText="Sessions avec feedback IA."
                    accent="slate"
                  />
                  <StatCard
                    label="Communication"
                    value={formatMetric(communicationAverage)}
                    helpText="Expression et aisance."
                    accent="blue"
                  />
                  <StatCard
                    label="Confiance"
                    value={formatMetric(confidenceAverage)}
                    helpText="Niveau moyen d’assurance."
                    accent="green"
                  />
                  <StatCard
                    label="Clarté"
                    value={formatMetric(clarityAverage)}
                    helpText="Structure et clarté."
                    accent="amber"
                  />
                  <StatCard
                    label="Pertinence"
                    value={formatMetric(relevanceAverage)}
                    helpText="Qualité et pertinence des réponses."
                    accent="blue"
                  />
                  <StatCard
                    label="Professionnalisme"
                    value={formatMetric(professionalismAverage)}
                    helpText="Posture et ton professionnel."
                    accent="green"
                  />
                </div>

                {latestFeedback && (
                  <Card style={{ padding: "24px", borderRadius: "24px" }}>
                    <h3 className="session-title" style={{ marginBottom: "14px" }}>
                      Dernier feedback IA
                    </h3>

                    <div style={{ display: "grid", gap: "14px" }}>
                      <div>
                        <p className="feedback-label">Points forts</p>
                        <p className="feedback-text">
                          {latestFeedback.strengths ||
                            "Feedback indisponible pour le moment."}
                        </p>
                      </div>

                      <div>
                        <p className="feedback-label">Points à améliorer</p>
                        <p className="feedback-text">
                          {latestFeedback.weaknesses ||
                            "Feedback temporairement indisponible."}
                        </p>
                      </div>

                      <div>
                        <p className="feedback-label">Conseil final</p>
                        <p className="feedback-text">
                          {latestFeedback.final_advice ||
                            "Réessayez plus tard ou vérifiez la configuration IA."}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </section>

          <section>
            <SectionHeader
              eyebrow="Activité récente"
              title="Sessions récentes"
              description="Reprenez rapidement vos dernières simulations."
            />

            {recentSessions.length === 0 ? (
              <Card style={{ padding: "24px", borderRadius: "24px" }}>
                <p className="empty-text">
                  Aucune session récente disponible pour le moment.
                </p>
              </Card>
            ) : (
              <div className="recent-grid">
                {recentSessions.map((session) => {
                  const title =
                    session?.scenario?.title ||
                    session?.scenario_title ||
                    "Session sans titre";

                  const category =
                    session?.scenario?.category ||
                    session?.scenario_category ||
                    "Catégorie inconnue";

                  const isCompleted = session.status === "completed";

                  return (
                    <Card
                      key={session.id}
                      style={{ padding: "22px", borderRadius: "22px" }}
                    >
                      <div className="session-top">
                        <div>
                          <h3 className="session-title">{title}</h3>
                          <p className="session-meta">
                            {category} • {formatDate(session.created_at)}
                          </p>
                        </div>

                        <div className="session-right">
                          <span
                            className={`status-badge ${
                              isCompleted ? "completed" : "active"
                            }`}
                          >
                            {isCompleted ? "Terminée" : "Active"}
                          </span>

                          <button
                            onClick={() => router.push(`/session/${session.id}`)}
                            className="resume-btn"
                          >
                            Reprendre
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
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
        }

        .hero-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-main {
          max-width: 760px;
          min-width: 0;
          flex: 1;
        }

        .eyebrow {
          margin: 0;
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 12px 0 10px;
          color: #0f172a;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .hero-text {
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

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid transparent;
        }

        .badge-blue {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }

        .badge-green {
          background: #ecfdf5;
          color: #15803d;
          border-color: #86efac;
        }

        .badge-amber {
          background: #fff7ed;
          color: #b45309;
          border-color: #fcd34d;
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 280px;
        }

        .hero-button {
          padding: 18px 24px;
          border-radius: 20px;
          border: 1px solid #cbd5e1;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .hero-button.primary {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        .hero-button.secondary {
          background: #ffffff;
          color: #0f172a;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .recent-grid {
          display: grid;
          gap: 16px;
        }

        .session-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .session-title {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 800;
        }

        .session-meta {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 500;
        }

        .session-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid transparent;
        }

        .status-badge.active {
          background: #fff7ed;
          color: #b45309;
          border-color: #fcd34d;
        }

        .status-badge.completed {
          background: #ecfdf5;
          color: #15803d;
          border-color: #86efac;
        }

        .resume-btn {
          padding: 14px 22px;
          border-radius: 18px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .empty-text {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.75;
        }

        .feedback-label {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
        }

        .feedback-text {
          margin: 0;
          color: #475569;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 500;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @media (max-width: 900px) {
          .page-shell {
            padding: 28px 18px 48px;
          }

          .hero-row {
            flex-direction: column;
            align-items: stretch;
          }

          .hero-actions {
            width: 100%;
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .page-shell {
            padding: 20px 12px 36px;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-text {
            font-size: 15px;
            line-height: 1.7;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .session-right {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </>
  );
}