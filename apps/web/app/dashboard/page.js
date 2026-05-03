"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Alert from "../components/ui/Alert";
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

function StatTile({ label, value, detail, tone = "blue", icon }) {
  return (
    <article className={`stat-tile ${tone}`}>
      <div className="tile-top">
        <span className="tile-icon">{icon}</span>
        <span className="tile-line" />
      </div>
      <strong>{value}</strong>
      <p>{label}</p>
      <small>{detail}</small>
    </article>
  );
}

function MetricBar({ label, description, value }) {
  return (
    <div className="metric-row">
      <div className="metric-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <div className="metric-value">
        <span>{formatMetric(value)}</span>
        <div className="metric-track">
          <div
            className="metric-fill"
            style={{ width: `${metricPercent(value)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({ eyebrow, title, description, action }) {
  return (
    <div className="empty-panel">
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
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
      label: "Clarté",
      value: clarityAverage,
      description: "Structure des réponses",
    },
    {
      label: "Pertinence",
      value: relevanceAverage,
      description: "Qualité des réponses",
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
          <section className="loading-card">
            <div className="loading-orbit">
              <span />
            </div>
            <p className="eyebrow">Dashboard étudiant</p>
            <h1>Chargement du cockpit Street University</h1>
            <p>
              Nous synchronisons vos sessions, vos scénarios et vos indicateurs
              de performance IA.
            </p>
          </section>
        </main>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            background:
              radial-gradient(circle at 12% 12%, rgba(37, 99, 235, 0.28), transparent 28%),
              radial-gradient(circle at 88% 18%, rgba(20, 184, 166, 0.2), transparent 30%),
              linear-gradient(135deg, #07111f 0%, #0f172a 46%, #eef4ff 46%, #ffffff 100%);
            padding: 28px 20px 64px;
          }

          .loading-shell {
            display: grid;
            place-items: center;
          }

          .loading-card {
            width: min(720px, 100%);
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 34px;
            background: rgba(255, 255, 255, 0.12);
            padding: 40px;
            color: #ffffff;
            box-shadow: 0 30px 90px rgba(2, 6, 23, 0.32);
            backdrop-filter: blur(22px);
          }

          .loading-orbit {
            width: 64px;
            height: 64px;
            border: 1px solid rgba(255, 255, 255, 0.24);
            border-radius: 24px;
            display: grid;
            place-items: center;
            margin-bottom: 22px;
            background: rgba(255, 255, 255, 0.1);
          }

          .loading-orbit span {
            width: 30px;
            height: 30px;
            border: 4px solid rgba(191, 219, 254, 0.55);
            border-top-color: #ffffff;
            border-radius: 999px;
            animation: spin 0.8s linear infinite;
          }

          .eyebrow {
            margin: 0 0 12px;
            color: #bfdbfe;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            font-size: clamp(32px, 5vw, 56px);
            line-height: 1;
            font-weight: 900;
          }

          p {
            margin: 16px 0 0;
            color: #dbeafe;
            font-size: 16px;
            line-height: 1.75;
            max-width: 620px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
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
              style={{
                marginBottom: "20px",
                borderRadius: "18px",
                boxShadow: "0 18px 44px rgba(15, 23, 42, 0.12)",
              }}
            >
              {error}
            </Alert>
          )}

          <section className="hero">
            <div className="hero-content">
              <div className="hero-copy">
                <div className="hero-kicker">
                  <span className="live-dot" />
                  Plateforme IA de soft-skills
                </div>
                <h1>
                  Bon retour, <span>{user?.full_name || "utilisateur"}</span>.
                </h1>
                <p>
                  Votre cockpit d'entraînement réunit simulations, voix,
                  sentiment, CV et feedback IA pour préparer une démonstration
                  claire, sérieuse et convaincante.
                </p>

                <div className="hero-actions" aria-label="Actions rapides">
                  <button
                    className="primary-action"
                    onClick={() => router.push("/scenarios")}
                  >
                    <span>AI</span>
                    Démarrer une simulation
                  </button>
                  <button
                    className="secondary-action"
                    onClick={() => router.push("/sessions")}
                  >
                    Sessions
                  </button>
                  <button
                    className="secondary-action"
                    onClick={() => router.push("/dashboard/performance")}
                  >
                    Performances
                  </button>
                </div>
              </div>

              <aside className="hero-command">
                <div className="command-top">
                  <span>Progression globale</span>
                  <strong>{stats.completionRate}%</strong>
                </div>
                <div className="hero-progress">
                  <span style={{ width: `${stats.completionRate}%` }} />
                </div>
                <div className="command-grid">
                  <div>
                    <strong>{stats.totalSessions}</strong>
                    <span>sessions</span>
                  </div>
                  <div>
                    <strong>{stats.completedSessions}</strong>
                    <span>terminées</span>
                  </div>
                  <div>
                    <strong>{stats.availableScenarios}</strong>
                    <span>scénarios</span>
                  </div>
                </div>
                <div className="command-footer">
                  <span>Dernière activité</span>
                  <strong>
                    {latestDate ? formatDate(latestDate) : "Aucune session"}
                  </strong>
                </div>
              </aside>
            </div>

            <div className="hero-badges">
              <span>Conversation IA</span>
              <span>Messages vocaux</span>
              <span>Analyse sentiment</span>
              <span>Feedback structuré</span>
            </div>
          </section>

          <section className="bento-grid" aria-label="Résumé du dashboard">
            <StatTile
              icon="01"
              label="Sessions lancées"
              value={stats.totalSessions}
              detail="Historique complet de vos simulations."
              tone="blue"
            />
            <StatTile
              icon="02"
              label="Sessions terminées"
              value={stats.completedSessions}
              detail="Parcours finalisés avec succès."
              tone="green"
            />
            <StatTile
              icon="03"
              label="Sessions actives"
              value={stats.activeSessions}
              detail="Entraînements à reprendre."
              tone="amber"
            />
            <StatTile
              icon="04"
              label="Scénarios disponibles"
              value={stats.availableScenarios}
              detail="Situations prêtes pour l'entraînement."
              tone="violet"
            />
            <article className="strategy-card">
              <p className="section-eyebrow">Plan rapide</p>
              <h2>Continuer l'entraînement avec un vrai flux produit</h2>
              <p>
                Lancez un scénario, échangez avec l'agent IA, puis consultez
                votre feedback pour améliorer communication, clarté et posture.
              </p>
              <div className="strategy-actions">
                <button onClick={() => router.push("/scenarios")}>
                  Explorer les scénarios
                </button>
                <button onClick={() => router.push("/dashboard/profile")}>
                  Profil et CV
                </button>
              </div>
            </article>
          </section>

          <section className="section-heading">
            <div>
              <p className="section-eyebrow">Performance IA</p>
              <h2>Lecture intelligente de vos progrès</h2>
            </div>
            <button
              className="text-action"
              onClick={() => router.push("/dashboard/performance")}
            >
              Voir le détail
            </button>
          </section>

          {!hasPerformance ? (
            <EmptyPanel
              eyebrow="Performance"
              title="Aucune session évaluée pour le moment"
              description="Terminez une simulation évaluée pour afficher vos scores, votre feedback IA et vos axes de progression."
              action={
                <button
                  className="primary-action compact"
                  onClick={() => router.push("/scenarios")}
                >
                  Commencer maintenant
                </button>
              }
            />
          ) : (
            <section className="performance-grid">
              <article className="score-panel">
                <div className="score-header">
                  <div>
                    <p className="section-eyebrow">Score moyen</p>
                    <h3>{formatScore(averageScore)}</h3>
                  </div>
                  <span>Meilleur {formatScore(bestScore)}</span>
                </div>
                <div className="score-orbit">
                  <div>
                    <strong>{formatMetric(averageScore)}</strong>
                    <span>sur 10</span>
                  </div>
                </div>
                <div className="score-footer">
                  <span>{completedRatedSessions} sessions évaluées</span>
                  <span>{stats.completionRate}% complétion</span>
                </div>
              </article>

              <article className="metrics-panel">
                {performanceMetrics.map((metric) => (
                  <MetricBar
                    key={metric.label}
                    label={metric.label}
                    description={metric.description}
                    value={metric.value}
                  />
                ))}
              </article>

              {latestFeedback && (
                <article className="feedback-panel">
                  <p className="section-eyebrow">Dernier feedback IA</p>
                  <h3>Conseils récents</h3>
                  <div className="feedback-list">
                    <div>
                      <span className="feedback-token success">Force</span>
                      <p>
                        {latestFeedback.strengths ||
                          "Feedback indisponible pour le moment."}
                      </p>
                    </div>
                    <div>
                      <span className="feedback-token warning">Axe</span>
                      <p>
                        {latestFeedback.weaknesses ||
                          "Feedback temporairement indisponible."}
                      </p>
                    </div>
                    <div>
                      <span className="feedback-token blue">Conseil</span>
                      <p>
                        {latestFeedback.final_advice ||
                          "Réessayez plus tard ou vérifiez la configuration IA."}
                      </p>
                    </div>
                  </div>
                </article>
              )}
            </section>
          )}

          <section className="section-heading recent-heading">
            <div>
              <p className="section-eyebrow">Activité récente</p>
              <h2>Dernières simulations</h2>
            </div>
            <button className="text-action" onClick={() => router.push("/sessions")}>
              Tout voir
            </button>
          </section>

          {recentSessions.length === 0 ? (
            <EmptyPanel
              eyebrow="Sessions"
              title="Aucune session récente"
              description="Lancez une simulation pour commencer à construire votre historique d'entraînement."
              action={
                <button
                  className="primary-action compact"
                  onClick={() => router.push("/scenarios")}
                >
                  Choisir un scénario
                </button>
              }
            />
          ) : (
            <section className="sessions-panel">
              {recentSessions.map((session, index) => {
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
                  <article className="session-row" key={session.id}>
                    <div className="session-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="session-main">
                      <h3>{title}</h3>
                      <p>
                        {category} · {formatDate(session.created_at)}
                      </p>
                    </div>
                    <span className={`status-badge ${isCompleted ? "completed" : "active"}`}>
                      {isCompleted ? "Terminée" : "Active"}
                    </span>
                    <button
                      className="resume-button"
                      onClick={() => router.push(`/session/${session.id}`)}
                    >
                      Reprendre
                    </button>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at 12% 4%, rgba(37, 99, 235, 0.24), transparent 28%),
            radial-gradient(circle at 90% 10%, rgba(20, 184, 166, 0.18), transparent 26%),
            linear-gradient(180deg, #07111f 0%, #0f172a 420px, #eef4ff 421px, #f8fafc 100%);
          padding: 30px 20px 72px;
        }

        .page-container {
          max-width: 1220px;
          margin: 0 auto;
        }

        .hero {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 34px;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.72)),
            linear-gradient(135deg, #0f172a, #2563eb);
          color: #ffffff;
          padding: 34px;
          box-shadow: 0 36px 100px rgba(2, 6, 23, 0.34);
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: linear-gradient(90deg, #000, transparent 78%);
          pointer-events: none;
        }

        .hero::after {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          right: -140px;
          top: -150px;
          border-radius: 120px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.55), rgba(20, 184, 166, 0.3));
          transform: rotate(18deg);
          filter: blur(2px);
          opacity: 0.9;
          pointer-events: none;
        }

        .hero-content,
        .hero-badges {
          position: relative;
          z-index: 1;
        }

        .hero-content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
          gap: 26px;
          align-items: stretch;
        }

        .hero-copy {
          min-width: 0;
          padding: 18px 0 8px;
        }

        .hero-kicker,
        .section-eyebrow {
          margin: 0;
          color: #60a5fa;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 34px;
          padding: 8px 12px;
          border: 1px solid rgba(191, 219, 254, 0.22);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: #dbeafe;
          backdrop-filter: blur(14px);
        }

        .live-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 7px rgba(34, 197, 94, 0.13);
        }

        .hero h1 {
          margin: 22px 0 18px;
          max-width: 820px;
          font-size: clamp(42px, 7vw, 78px);
          line-height: 0.95;
          font-weight: 950;
        }

        .hero h1 span {
          color: #bfdbfe;
        }

        .hero-copy > p {
          margin: 0;
          max-width: 720px;
          color: #dbeafe;
          font-size: 17px;
          line-height: 1.8;
          font-weight: 500;
        }

        .hero-actions,
        .strategy-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        button {
          font-family: inherit;
        }

        .primary-action,
        .secondary-action,
        .text-action,
        .strategy-actions button,
        .resume-button {
          border: 0;
          border-radius: 16px;
          cursor: pointer;
          font-weight: 900;
          transition:
            transform 0.18s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease;
        }

        .primary-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 56px;
          padding: 15px 20px;
          background: linear-gradient(135deg, #ffffff, #dbeafe);
          color: #0f172a;
          box-shadow: 0 18px 48px rgba(37, 99, 235, 0.28);
          font-size: 15px;
        }

        .primary-action span {
          display: inline-grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 11px;
          background: #2563eb;
          color: #ffffff;
          font-size: 11px;
        }

        .primary-action.compact {
          min-height: 48px;
          margin-top: 18px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          box-shadow: 0 16px 34px rgba(37, 99, 235, 0.24);
        }

        .secondary-action {
          min-height: 56px;
          padding: 15px 18px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          backdrop-filter: blur(12px);
        }

        .primary-action:hover,
        .secondary-action:hover,
        .text-action:hover,
        .strategy-actions button:hover,
        .resume-button:hover {
          transform: translateY(-2px);
        }

        .hero-command {
          display: flex;
          flex-direction: column;
          min-height: 360px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 28px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08)),
            rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(22px);
        }

        .command-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .command-top span,
        .command-footer span {
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .command-top strong {
          color: #ffffff;
          font-size: 58px;
          line-height: 0.9;
          font-weight: 950;
        }

        .hero-progress {
          overflow: hidden;
          height: 12px;
          margin: 22px 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
        }

        .hero-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #60a5fa, #22c55e);
          box-shadow: 0 0 32px rgba(96, 165, 250, 0.55);
        }

        .command-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .command-grid div {
          min-width: 0;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.22);
          padding: 14px;
        }

        .command-grid strong {
          display: block;
          color: #ffffff;
          font-size: 28px;
          line-height: 1;
          font-weight: 950;
        }

        .command-grid span {
          display: block;
          margin-top: 7px;
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 800;
        }

        .command-footer {
          margin-top: auto;
          padding-top: 22px;
        }

        .command-footer strong {
          display: block;
          margin-top: 8px;
          color: #ffffff;
          font-size: 20px;
          font-weight: 900;
        }

        .hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 28px;
        }

        .hero-badges span {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          padding: 9px 13px;
          border: 1px solid rgba(191, 219, 254, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: #dbeafe;
          font-size: 13px;
          font-weight: 850;
          backdrop-filter: blur(12px);
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .stat-tile,
        .strategy-card,
        .score-panel,
        .metrics-panel,
        .feedback-panel,
        .sessions-panel,
        .empty-panel {
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(18px);
        }

        .stat-tile {
          position: relative;
          overflow: hidden;
          min-height: 210px;
          padding: 20px;
          transition:
            transform 0.2s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .stat-tile::after {
          content: "";
          position: absolute;
          inset: auto -60px -90px auto;
          width: 190px;
          height: 190px;
          border-radius: 58px;
          opacity: 0.16;
          transform: rotate(18deg);
        }

        .stat-tile.blue::after {
          background: #2563eb;
        }

        .stat-tile.green::after {
          background: #16a34a;
        }

        .stat-tile.amber::after {
          background: #f59e0b;
        }

        .stat-tile.violet::after {
          background: #7c3aed;
        }

        .stat-tile:hover,
        .strategy-card:hover,
        .session-row:hover {
          transform: translateY(-4px);
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.13);
          border-color: rgba(147, 197, 253, 0.85);
        }

        .tile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 28px;
        }

        .tile-icon {
          display: inline-grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: #0f172a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 950;
        }

        .tile-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, #cbd5e1, transparent);
        }

        .stat-tile strong {
          display: block;
          color: #0f172a;
          font-size: 46px;
          line-height: 0.95;
          font-weight: 950;
        }

        .stat-tile p {
          margin: 12px 0 8px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 900;
        }

        .stat-tile small {
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
          font-weight: 650;
        }

        .strategy-card {
          grid-column: span 2;
          min-height: 210px;
          padding: 24px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(239, 246, 255, 0.9)),
            #ffffff;
          transition:
            transform 0.2s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .strategy-card h2,
        .section-heading h2 {
          margin: 8px 0 0;
          color: #0f172a;
          font-size: clamp(24px, 3vw, 34px);
          line-height: 1.08;
          font-weight: 950;
        }

        .strategy-card > p:not(.section-eyebrow) {
          margin: 14px 0 0;
          color: #475569;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 550;
          max-width: 720px;
        }

        .strategy-actions button,
        .text-action,
        .resume-button {
          min-height: 44px;
          padding: 11px 14px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin: 34px 0 16px;
        }

        .text-action {
          flex: 0 0 auto;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
          gap: 16px;
          align-items: stretch;
        }

        .score-panel {
          position: relative;
          overflow: hidden;
          min-height: 430px;
          padding: 24px;
          background:
            linear-gradient(160deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.88)),
            #0f172a;
          color: #ffffff;
        }

        .score-panel::after {
          content: "";
          position: absolute;
          right: -100px;
          bottom: -140px;
          width: 300px;
          height: 300px;
          border-radius: 90px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.55), rgba(22, 163, 74, 0.34));
          transform: rotate(24deg);
        }

        .score-header,
        .score-orbit,
        .score-footer {
          position: relative;
          z-index: 1;
        }

        .score-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .score-header h3 {
          margin: 9px 0 0;
          color: #ffffff;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 0.95;
          font-weight: 950;
        }

        .score-header span {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: #dbeafe;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .score-orbit {
          width: min(250px, 74vw);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          margin: 34px auto;
          border-radius: 50%;
          background:
            radial-gradient(circle, rgba(15, 23, 42, 0.98) 0 55%, transparent 56%),
            conic-gradient(#60a5fa 0deg, #22c55e ${metricPercent(averageScore) * 3.6}deg, rgba(255, 255, 255, 0.12) 0deg);
          box-shadow:
            inset 0 0 40px rgba(255, 255, 255, 0.04),
            0 24px 60px rgba(0, 0, 0, 0.28);
        }

        .score-orbit div {
          text-align: center;
        }

        .score-orbit strong {
          display: block;
          color: #ffffff;
          font-size: 58px;
          line-height: 0.95;
          font-weight: 950;
        }

        .score-orbit span {
          display: block;
          margin-top: 8px;
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 900;
        }

        .score-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .score-footer span {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: #dbeafe;
          font-size: 12px;
          font-weight: 900;
        }

        .metrics-panel {
          padding: 24px;
          display: grid;
          gap: 14px;
        }

        .metric-row {
          display: grid;
          grid-template-columns: minmax(150px, 0.72fr) minmax(180px, 1fr);
          gap: 18px;
          align-items: center;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: linear-gradient(180deg, #ffffff, #f8fafc);
        }

        .metric-copy strong {
          display: block;
          color: #0f172a;
          font-size: 15px;
          font-weight: 950;
        }

        .metric-copy span {
          display: block;
          margin-top: 5px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 700;
        }

        .metric-value {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 12px;
          align-items: center;
        }

        .metric-value > span {
          color: #0f172a;
          font-size: 14px;
          font-weight: 950;
          text-align: right;
        }

        .metric-track {
          overflow: hidden;
          height: 11px;
          border-radius: 999px;
          background: #e2e8f0;
        }

        .metric-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #14b8a6, #16a34a);
        }

        .feedback-panel {
          grid-column: 1 / -1;
          padding: 24px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(239, 246, 255, 0.86)),
            #ffffff;
        }

        .feedback-panel h3 {
          margin: 8px 0 18px;
          color: #0f172a;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 950;
        }

        .feedback-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .feedback-list div {
          min-width: 0;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.75);
          padding: 18px;
        }

        .feedback-token {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
          margin-bottom: 12px;
        }

        .feedback-token.success {
          background: #dcfce7;
          color: #166534;
        }

        .feedback-token.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .feedback-token.blue {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .feedback-list p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.72;
          font-weight: 550;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .recent-heading {
          margin-top: 38px;
        }

        .sessions-panel {
          display: grid;
          gap: 12px;
          padding: 14px;
        }

        .session-row {
          display: grid;
          grid-template-columns: 56px minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          background: linear-gradient(180deg, #ffffff, #f8fafc);
          transition:
            transform 0.2s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .session-index {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: #0f172a;
          color: #ffffff;
          font-size: 13px;
          font-weight: 950;
        }

        .session-main {
          min-width: 0;
        }

        .session-main h3 {
          margin: 0 0 7px;
          color: #0f172a;
          font-size: 16px;
          line-height: 1.25;
          font-weight: 950;
        }

        .session-main p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 650;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
        }

        .status-badge.active {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.completed {
          background: #dcfce7;
          color: #166534;
        }

        .resume-button {
          min-height: 40px;
          white-space: nowrap;
        }

        .empty-panel {
          padding: 30px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(239, 246, 255, 0.86)),
            #ffffff;
        }

        .empty-panel > span {
          color: #2563eb;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .empty-panel h3 {
          margin: 10px 0 8px;
          color: #0f172a;
          font-size: 26px;
          line-height: 1.12;
          font-weight: 950;
        }

        .empty-panel p {
          margin: 0;
          max-width: 720px;
          color: #64748b;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 600;
        }

        @media (max-width: 1100px) {
          .bento-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .hero-content,
          .performance-grid {
            grid-template-columns: 1fr;
          }

          .hero-command {
            min-height: auto;
          }
        }

        @media (max-width: 760px) {
          .page-shell {
            padding: 18px 12px 46px;
            background:
              radial-gradient(circle at 20% 0%, rgba(37, 99, 235, 0.24), transparent 30%),
              linear-gradient(180deg, #07111f 0%, #0f172a 520px, #eef4ff 521px, #f8fafc 100%);
          }

          .hero {
            padding: 22px;
            border-radius: 26px;
          }

          .hero h1 {
            font-size: 42px;
          }

          .hero-copy > p {
            font-size: 15px;
            line-height: 1.7;
          }

          .hero-actions,
          .strategy-actions {
            flex-direction: column;
          }

          .primary-action,
          .secondary-action,
          .strategy-actions button,
          .text-action {
            width: 100%;
          }

          .command-grid,
          .bento-grid,
          .feedback-list {
            grid-template-columns: 1fr;
          }

          .strategy-card {
            grid-column: auto;
          }

          .section-heading {
            align-items: stretch;
            flex-direction: column;
          }

          .metric-row,
          .session-row {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .metric-value {
            width: 100%;
          }

          .session-index {
            width: 42px;
            height: 42px;
          }
        }

        @media (max-width: 460px) {
          .hero h1 {
            font-size: 35px;
          }

          .hero-command,
          .stat-tile,
          .strategy-card,
          .score-panel,
          .metrics-panel,
          .feedback-panel,
          .empty-panel {
            border-radius: 22px;
          }

          .command-top {
            flex-direction: column;
          }

          .score-header {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
