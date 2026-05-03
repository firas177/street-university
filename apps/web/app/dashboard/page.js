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

function metricPercent(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, num * 10));
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
          "Reessayez plus tard ou verifiez la configuration IA."
        ),
      }
    : null;

  const hasPerformance = completedRatedSessions > 0;

  const performanceMetrics = [
    {
      label: "Communication",
      value: communicationAverage,
      description: "Expression et aisance",
    },
    {
      label: "Confiance",
      value: confidenceAverage,
      description: "Assurance moyenne",
    },
    {
      label: "Clarte",
      value: clarityAverage,
      description: "Structure des reponses",
    },
    {
      label: "Pertinence",
      value: relevanceAverage,
      description: "Qualite des reponses",
    },
    {
      label: "Professionnalisme",
      value: professionalismAverage,
      description: "Posture et ton",
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell loading-shell">
          <div className="page-container">
            <Card
              style={{
                padding: "34px",
                borderRadius: "8px",
                border: "1px solid rgba(37, 99, 235, 0.18)",
                boxShadow: "0 24px 70px rgba(15, 23, 42, 0.08)",
              }}
            >
              <div className="loading-panel">
                <span className="loader-mark" />
                <div>
                  <p className="eyebrow">Dashboard etudiant</p>
                  <h1 className="hero-title">Chargement du dashboard...</h1>
                  <p className="hero-text">
                    Nous preparons vos statistiques, scenarios et sessions
                    recentes.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            background:
              radial-gradient(circle at top left, rgba(37, 99, 235, 0.13), transparent 34%),
              linear-gradient(180deg, #f8fafc 0%, #eef4ff 54%, #ffffff 100%);
            padding: 32px 20px 60px;
          }

          .page-container {
            max-width: 1180px;
            margin: 0 auto;
          }

          .loading-shell {
            display: flex;
            align-items: center;
          }

          .loading-panel {
            display: flex;
            align-items: center;
            gap: 18px;
          }

          .loader-mark {
            width: 48px;
            height: 48px;
            border: 4px solid #dbeafe;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: spin 0.9s linear infinite;
            flex: 0 0 auto;
          }

          .eyebrow {
            margin: 0;
            color: #2563eb;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .hero-title {
            margin: 10px 0 8px;
            color: #0f172a;
            font-size: clamp(28px, 4vw, 42px);
            line-height: 1.05;
            font-weight: 900;
          }

          .hero-text {
            margin: 0;
            color: #64748b;
            font-size: 16px;
            line-height: 1.7;
            font-weight: 500;
            max-width: 680px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 640px) {
            .page-shell {
              padding: 20px 12px 36px;
            }

            .loading-panel {
              align-items: flex-start;
              flex-direction: column;
            }
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
              style={{ marginBottom: "18px", borderRadius: "8px" }}
            >
              {error}
            </Alert>
          )}

          <section className="hero-card">
            <div className="hero-grid">
              <div className="hero-main">
                <p className="eyebrow">Street University</p>
                <h1 className="hero-title">
                  Bon retour, {user?.full_name || "utilisateur"}.
                </h1>
                <p className="hero-text">
                  Pilotez vos simulations, suivez vos progres reels et preparez
                  vos entretiens avec une vision claire de votre evolution.
                </p>

                <div className="hero-actions" aria-label="Actions rapides">
                  <button
                    onClick={() => router.push("/scenarios")}
                    className="action-button primary"
                  >
                    <span className="button-icon">+</span>
                    Demarrer une simulation
                  </button>

                  <button
                    onClick={() => router.push("/sessions")}
                    className="action-button secondary"
                  >
                    <span className="button-icon">{">"}</span>
                    Voir mes sessions
                  </button>

                  <button
                    onClick={() => router.push("/dashboard/performance")}
                    className="action-button secondary"
                  >
                    <span className="button-icon">o</span>
                    Performances
                  </button>
                </div>
              </div>

              <div className="hero-panel" aria-label="Resume du dashboard">
                <div className="hero-panel-top">
                  <span className="panel-label">Progression</span>
                  <strong>{stats.completionRate}%</strong>
                </div>
                <div className="progress-track">
                  <span
                    className="progress-fill"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>

                <div className="hero-mini-grid">
                  <div>
                    <span>{stats.totalSessions}</span>
                    <p>Sessions</p>
                  </div>
                  <div>
                    <span>{stats.completedSessions}</span>
                    <p>Terminees</p>
                  </div>
                  <div>
                    <span>{stats.availableScenarios}</span>
                    <p>Scenarios</p>
                  </div>
                </div>

                <div className="next-step">
                  <span className="next-dot" />
                  <p>
                    Derniere activite :{" "}
                    <strong>
                      {latestDate ? formatDate(latestDate) : "Aucune session"}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="section-block">
            <SectionHeader
              eyebrow="Vue d'ensemble"
              title="Indicateurs principaux"
              description="Un resume compact de vos sessions, de votre activite et des scenarios disponibles."
            />

            <div className="stats-grid">
              <StatCard
                label="Total sessions"
                value={stats.totalSessions}
                helpText="Toutes les simulations lancees."
                accent="blue"
                style={{ borderRadius: "8px" }}
              />
              <StatCard
                label="Sessions terminees"
                value={stats.completedSessions}
                helpText="Simulations finalisees avec succes."
                accent="green"
                style={{ borderRadius: "8px" }}
              />
              <StatCard
                label="Sessions actives"
                value={stats.activeSessions}
                helpText="Simulations actuellement en cours."
                accent="amber"
                style={{ borderRadius: "8px" }}
              />
              <StatCard
                label="Scenarios disponibles"
                value={stats.availableScenarios}
                helpText="Situations accessibles sur la plateforme."
                accent="slate"
                style={{ borderRadius: "8px" }}
              />
              <StatCard
                label="Taux de completion"
                value={`${stats.completionRate}%`}
                helpText="Part de sessions terminees."
                accent="blue"
                style={{ borderRadius: "8px" }}
              />
            </div>
          </section>

          <section className="section-block">
            <SectionHeader
              eyebrow="Performance IA"
              title="Analyse de vos sessions evaluees"
              description="Scores calcules depuis vos sessions avec feedback pour visualiser vos points forts."
              action={
                <button
                  onClick={() => router.push("/dashboard/performance")}
                  className="small-link-button"
                >
                  Detail complet
                </button>
              }
            />

            {!hasPerformance ? (
              <Card style={{ padding: "26px", borderRadius: "8px" }}>
                <div className="empty-state">
                  <span className="empty-icon">o</span>
                  <div>
                    <h3>Aucune performance evaluee</h3>
                    <p>
                      Termine une session evaluee pour afficher tes scores, ton
                      feedback IA et les axes de progression prioritaires.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="performance-layout">
                <Card
                  style={{
                    padding: "26px",
                    borderRadius: "8px",
                    border: "1px solid rgba(37, 99, 235, 0.18)",
                  }}
                >
                  <div className="score-card-top">
                    <div>
                      <p className="panel-label">Score moyen</p>
                      <h3 className="score-value">{formatScore(averageScore)}</h3>
                    </div>
                    <span className="score-chip">
                      Meilleur {formatScore(bestScore)}
                    </span>
                  </div>

                  <div className="score-summary">
                    <div>
                      <strong>{completedRatedSessions}</strong>
                      <span>sessions evaluees</span>
                    </div>
                    <div>
                      <strong>{formatMetric(bestScore)}</strong>
                      <span>meilleure note</span>
                    </div>
                  </div>

                  <div className="metric-list">
                    {performanceMetrics.map((metric) => (
                      <div className="metric-row" key={metric.label}>
                        <div className="metric-copy">
                          <strong>{metric.label}</strong>
                          <span>{metric.description}</span>
                        </div>
                        <div className="metric-bar-wrap">
                          <span>{formatMetric(metric.value)}</span>
                          <div className="metric-track">
                            <div
                              className="metric-fill"
                              style={{ width: `${metricPercent(metric.value)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {latestFeedback && (
                  <Card style={{ padding: "26px", borderRadius: "8px" }}>
                    <div className="feedback-header">
                      <p className="panel-label">Dernier feedback IA</p>
                      <h3>Conseils recents</h3>
                    </div>

                    <div className="feedback-grid">
                      <div className="feedback-item">
                        <span className="feedback-token success">Force</span>
                        <p>
                          {latestFeedback.strengths ||
                            "Feedback indisponible pour le moment."}
                        </p>
                      </div>

                      <div className="feedback-item">
                        <span className="feedback-token warning">Axe</span>
                        <p>
                          {latestFeedback.weaknesses ||
                            "Feedback temporairement indisponible."}
                        </p>
                      </div>

                      <div className="feedback-item">
                        <span className="feedback-token blue">Conseil</span>
                        <p>
                          {latestFeedback.final_advice ||
                            "Reessayez plus tard ou verifiez la configuration IA."}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </section>

          <section className="section-block">
            <SectionHeader
              eyebrow="Activite recente"
              title="Sessions recentes"
              description="Reprenez rapidement vos dernieres simulations ou consultez leur etat."
              action={
                <button
                  onClick={() => router.push("/sessions")}
                  className="small-link-button"
                >
                  Tout voir
                </button>
              }
            />

            {recentSessions.length === 0 ? (
              <Card style={{ padding: "26px", borderRadius: "8px" }}>
                <div className="empty-state">
                  <span className="empty-icon">+</span>
                  <div>
                    <h3>Aucune session recente</h3>
                    <p>
                      Lance une simulation pour commencer a construire ton
                      historique d'entrainement.
                    </p>
                  </div>
                </div>
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
                    "Categorie inconnue";

                  const isCompleted = session.status === "completed";

                  return (
                    <Card
                      key={session.id}
                      hoverable
                      style={{ padding: "0", borderRadius: "8px" }}
                    >
                      <article className="session-card">
                        <div className="session-marker" />
                        <div className="session-content">
                          <div>
                            <h3 className="session-title">{title}</h3>
                            <p className="session-meta">
                              {category} - {formatDate(session.created_at)}
                            </p>
                          </div>

                          <div className="session-right">
                            <span
                              className={`status-badge ${
                                isCompleted ? "completed" : "active"
                              }`}
                            >
                              {isCompleted ? "Terminee" : "Active"}
                            </span>

                            <button
                              onClick={() => router.push(`/session/${session.id}`)}
                              className="resume-btn"
                            >
                              Reprendre
                            </button>
                          </div>
                        </div>
                      </article>
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
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.13), transparent 32%),
            radial-gradient(circle at 88% 12%, rgba(22, 163, 74, 0.09), transparent 28%),
            linear-gradient(180deg, #f8fafc 0%, #eef4ff 52%, #ffffff 100%);
          padding: 28px 20px 64px;
        }

        .page-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.9)),
            linear-gradient(135deg, #ffffff, #dbeafe);
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.1);
          margin-bottom: 26px;
        }

        .hero-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(90deg, #000 0%, transparent 78%);
          pointer-events: none;
        }

        .hero-grid {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 390px);
          gap: 28px;
          align-items: stretch;
          padding: 34px;
        }

        .hero-main {
          min-width: 0;
          align-self: center;
        }

        .eyebrow {
          margin: 0;
          color: #2563eb;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 12px 0 12px;
          color: #0f172a;
          font-size: clamp(34px, 5vw, 58px);
          line-height: 1;
          font-weight: 900;
        }

        .hero-text {
          margin: 0;
          color: #334155;
          font-size: 17px;
          line-height: 1.75;
          font-weight: 500;
          max-width: 720px;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 26px;
        }

        .action-button,
        .small-link-button,
        .resume-btn {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 800;
          transition:
            transform 0.18s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease;
        }

        .action-button:hover,
        .small-link-button:hover,
        .resume-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
          border-color: #93c5fd;
        }

        .action-button {
          min-height: 52px;
          padding: 14px 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 15px;
          white-space: nowrap;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 16px 34px rgba(37, 99, 235, 0.25);
        }

        .action-button.secondary,
        .small-link-button,
        .resume-btn {
          background: rgba(255, 255, 255, 0.88);
          color: #0f172a;
        }

        .button-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.18);
          font-size: 15px;
          line-height: 1;
        }

        .secondary .button-icon {
          background: #eff6ff;
          color: #2563eb;
        }

        .hero-panel {
          border: 1px solid rgba(191, 219, 254, 0.9);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.82);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
          padding: 22px;
          backdrop-filter: blur(10px);
        }

        .hero-panel-top,
        .score-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .hero-panel-top strong {
          color: #0f172a;
          font-size: 42px;
          line-height: 1;
          font-weight: 900;
        }

        .panel-label {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .progress-track,
        .metric-track {
          overflow: hidden;
          width: 100%;
          height: 10px;
          border-radius: 999px;
          background: #e2e8f0;
        }

        .progress-track {
          margin-top: 18px;
        }

        .progress-fill,
        .metric-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #16a34a);
        }

        .hero-mini-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .hero-mini-grid div {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          padding: 14px;
        }

        .hero-mini-grid span {
          display: block;
          color: #0f172a;
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
        }

        .hero-mini-grid p,
        .next-step p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 700;
        }

        .next-step {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 14px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .next-step p {
          margin: 0;
        }

        .next-step strong {
          color: #0f172a;
        }

        .next-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #16a34a;
          box-shadow: 0 0 0 6px rgba(22, 163, 74, 0.11);
          flex: 0 0 auto;
        }

        .section-block {
          margin-bottom: 28px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }

        .small-link-button {
          min-height: 42px;
          padding: 10px 14px;
          font-size: 14px;
        }

        .empty-state {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .empty-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          font-size: 22px;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .empty-state h3 {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
        }

        .empty-state p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 500;
        }

        .performance-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
          gap: 16px;
          align-items: start;
        }

        .score-value {
          margin: 8px 0 0;
          color: #0f172a;
          font-size: clamp(34px, 5vw, 48px);
          line-height: 1;
          font-weight: 900;
        }

        .score-chip {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 8px 11px;
          border-radius: 8px;
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
        }

        .score-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin: 22px 0;
        }

        .score-summary div {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 14px;
        }

        .score-summary strong {
          display: block;
          color: #0f172a;
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
        }

        .score-summary span {
          display: block;
          margin-top: 6px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .metric-list {
          display: grid;
          gap: 15px;
        }

        .metric-row {
          display: grid;
          grid-template-columns: minmax(130px, 0.75fr) minmax(160px, 1fr);
          gap: 16px;
          align-items: center;
        }

        .metric-copy strong {
          display: block;
          color: #0f172a;
          font-size: 14px;
          font-weight: 900;
        }

        .metric-copy span {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.35;
          font-weight: 700;
        }

        .metric-bar-wrap {
          display: grid;
          grid-template-columns: 38px 1fr;
          gap: 10px;
          align-items: center;
        }

        .metric-bar-wrap > span {
          color: #334155;
          font-size: 13px;
          font-weight: 900;
          text-align: right;
        }

        .metric-track {
          height: 8px;
        }

        .feedback-header h3 {
          margin: 8px 0 0;
          color: #0f172a;
          font-size: 24px;
          line-height: 1.15;
          font-weight: 900;
        }

        .feedback-grid {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .feedback-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          padding: 16px;
        }

        .feedback-token {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 5px 9px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .feedback-token.success {
          background: #ecfdf5;
          color: #166534;
        }

        .feedback-token.warning {
          background: #fffbeb;
          color: #92400e;
        }

        .feedback-token.blue {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .feedback-item p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .recent-grid {
          display: grid;
          gap: 12px;
        }

        .session-card {
          display: grid;
          grid-template-columns: 5px 1fr;
          min-height: 92px;
        }

        .session-marker {
          background: linear-gradient(180deg, #2563eb, #16a34a);
        }

        .session-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 18px 20px;
          min-width: 0;
        }

        .session-title {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 17px;
          line-height: 1.25;
          font-weight: 900;
        }

        .session-meta {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.55;
          font-weight: 600;
        }

        .session-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          flex: 0 0 auto;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 7px 11px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid transparent;
        }

        .status-badge.active {
          background: #fff7ed;
          color: #b45309;
          border-color: #fed7aa;
        }

        .status-badge.completed {
          background: #ecfdf5;
          color: #15803d;
          border-color: #bbf7d0;
        }

        .resume-btn {
          min-height: 38px;
          padding: 9px 13px;
          font-size: 13px;
        }

        @media (max-width: 980px) {
          .hero-grid,
          .performance-layout {
            grid-template-columns: 1fr;
          }

          .hero-panel {
            max-width: 560px;
          }
        }

        @media (max-width: 720px) {
          .page-shell {
            padding: 20px 12px 44px;
          }

          .hero-grid {
            padding: 24px;
          }

          .hero-title {
            font-size: 36px;
          }

          .hero-text {
            font-size: 15px;
            line-height: 1.7;
          }

          .action-button {
            width: 100%;
            white-space: normal;
          }

          .hero-mini-grid,
          .score-summary {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .metric-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .session-content {
            align-items: flex-start;
            flex-direction: column;
          }

          .session-right {
            width: 100%;
            justify-content: flex-start;
          }
        }

        @media (max-width: 460px) {
          .hero-grid {
            padding: 20px;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-panel {
            padding: 18px;
          }

          .hero-panel-top strong {
            font-size: 34px;
          }

          .empty-state {
            flex-direction: column;
          }

          .score-card-top {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
