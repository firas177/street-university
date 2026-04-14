"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import StatCard from "../../components/ui/StatCard";
import { getDashboardPerformance } from "../../lib/api";

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

function safeNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function clampPercentFrom10(value) {
  const num = safeNumber(value);
  if (num === null) return 0;
  return Math.max(0, Math.min(100, num * 10));
}

function pickLevel(value) {
  const num = safeNumber(value);
  if (num === null) return "Indisponible";
  if (num >= 8) return "Excellent";
  if (num >= 6.5) return "Bon niveau";
  if (num >= 5) return "En progression";
  return "À renforcer";
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

function ProgressItem({ label, value }) {
  const display = formatMetric(value);
  const percent = clampPercentFrom10(value);
  const level = pickLevel(value);

  return (
    <div className="progress-card">
      <div className="progress-top">
        <div>
          <h3 className="progress-title">{label}</h3>
          <p className="progress-subtitle">{level}</p>
        </div>
        <span className="progress-score">{display}</span>
      </div>

      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPerformancePage() {
  const router = useRouter();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    async function loadPerformance() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardPerformance(token);
        setPerformance(data || null);
      } catch (err) {
        console.error("Performance page error:", err);
        setError(err?.message || "Impossible de charger les performances.");
      } finally {
        setLoading(false);
      }
    }

    loadPerformance();
  }, [router]);

  const completedRatedSessions = performance?.completed_rated_sessions ?? 0;
  const hasPerformance = completedRatedSessions > 0;

  const averageScore = performance?.average_score;
  const bestScore = performance?.best_score;
  const communicationAverage = performance?.communication_average;
  const confidenceAverage = performance?.confidence_average;
  const clarityAverage = performance?.clarity_average;
  const relevanceAverage = performance?.relevance_average;
  const professionalismAverage = performance?.professionalism_average;

  const latestFeedback = performance?.latest_feedback
    ? {
        strengths: sanitizeFeedbackText(
          performance?.latest_feedback?.strengths,
          "Feedback indisponible pour le moment."
        ),
        weaknesses: sanitizeFeedbackText(
          performance?.latest_feedback?.weaknesses,
          "Feedback temporairement indisponible."
        ),
        final_advice: sanitizeFeedbackText(
          performance?.latest_feedback?.final_advice,
          "Réessayez plus tard ou vérifiez la configuration IA."
        ),
      }
    : null;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <Card style={{ padding: "28px", borderRadius: "28px" }}>
              <p className="eyebrow">Performance</p>
              <h1 className="hero-title">Chargement des performances...</h1>
              <p className="hero-text">
                Nous récupérons vos statistiques détaillées et votre dernier feedback.
              </p>
            </Card>
          </div>
        </main>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #ffffff 100%);
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
              type="error"
              style={{
                marginBottom: "18px",
                borderRadius: "18px",
              }}
            >
              {error}
            </Alert>
          )}

          <Card
            style={{
              padding: "32px",
              borderRadius: "30px",
              background: "linear-gradient(135deg, #ffffff, #eff6ff 50%, #dbeafe)",
              border: "1px solid #dbeafe",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
              marginBottom: "24px",
            }}
          >
            <div className="hero-row">
              <div className="hero-main">
                <p className="eyebrow">Performance réelle</p>
                <h1 className="hero-title">Mes performances détaillées</h1>
                <p className="hero-text">
                  Consulte tes scores réels, tes indicateurs par compétence et le
                  dernier feedback généré par l’IA.
                </p>
              </div>

              <div className="hero-actions">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                >
                  Retour au dashboard
                </Button>
              </div>
            </div>
          </Card>

          <section style={{ marginBottom: "24px" }}>
            <SectionHeader
              eyebrow="Performance"
              title="Aperçu global"
              description="Résumé des statistiques calculées à partir de vos sessions évaluées."
            />

            {!hasPerformance ? (
              <Card style={{ padding: "24px", borderRadius: "24px" }}>
                <Alert type="info" style={{ borderRadius: "16px" }}>
                  Aucune performance réelle n’est encore disponible. Termine une
                  session évaluée pour voir apparaître tes statistiques détaillées.
                </Alert>
              </Card>
            ) : (
              <div className="stats-grid">
                <StatCard
                  label="Score global moyen"
                  value={formatScore(averageScore)}
                  helpText="Moyenne globale des sessions notées."
                  accent="blue"
                />
                <StatCard
                  label="Meilleur score"
                  value={formatScore(bestScore)}
                  helpText="Meilleure performance obtenue."
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
                  helpText="Qualité de l’expression."
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
                  helpText="Clarté et structure."
                  accent="amber"
                />
                <StatCard
                  label="Pertinence"
                  value={formatMetric(relevanceAverage)}
                  helpText="Adéquation du contenu."
                  accent="blue"
                />
                <StatCard
                  label="Professionnalisme"
                  value={formatMetric(professionalismAverage)}
                  helpText="Posture et qualité professionnelle."
                  accent="slate"
                />
              </div>
            )}
          </section>

          {hasPerformance && (
            <section style={{ marginBottom: "24px" }}>
              <SectionHeader
                eyebrow="Progression"
                title="État actuel et historique"
                description="Vue simple de vos compétences actuelles et préparation d’un futur historique détaillé."
              />

              <div className="history-layout">
                <Card style={{ padding: "24px", borderRadius: "24px" }}>
                  <h3 className="history-title">Niveau actuel par compétence</h3>
                  <p className="history-text">
                    Cette section résume votre niveau actuel sur les axes les plus
                    importants. Un historique détaillé session par session pourra
                    être ajouté ensuite.
                  </p>

                  <div className="progress-list">
                    <ProgressItem
                      label="Communication"
                      value={communicationAverage}
                    />
                    <ProgressItem
                      label="Confiance"
                      value={confidenceAverage}
                    />
                    <ProgressItem
                      label="Clarté"
                      value={clarityAverage}
                    />
                    <ProgressItem
                      label="Pertinence"
                      value={relevanceAverage}
                    />
                    <ProgressItem
                      label="Professionnalisme"
                      value={professionalismAverage}
                    />
                  </div>
                </Card>

                <Card style={{ padding: "24px", borderRadius: "24px" }}>
                  <h3 className="history-title">Historique détaillé</h3>
                  <p className="history-text">
                    La page est déjà prête pour accueillir une vraie courbe
                    d’évolution ou une liste chronologique des dernières sessions
                    notées.
                  </p>

                  <div className="history-placeholder">
                    <div className="history-point">
                      <span className="history-dot" />
                      <div>
                        <p className="history-item-title">Dernier état connu</p>
                        <p className="history-item-text">
                          Score moyen actuel : {formatScore(averageScore)}
                        </p>
                      </div>
                    </div>

                    <div className="history-point">
                      <span className="history-dot" />
                      <div>
                        <p className="history-item-title">Meilleure performance</p>
                        <p className="history-item-text">
                          Meilleur score observé : {formatScore(bestScore)}
                        </p>
                      </div>
                    </div>

                    <div className="history-point">
                      <span className="history-dot" />
                      <div>
                        <p className="history-item-title">Prochaine amélioration</p>
                        <p className="history-item-text">
                          Ajouter plus tard un vrai historique par session ou un
                          graphique d’évolution.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          )}

          {hasPerformance && (
            <section style={{ marginBottom: "24px" }}>
              <SectionHeader
                eyebrow="Feedback"
                title="Dernier feedback IA"
                description="Résumé du dernier retour généré après une session évaluée."
              />

              <div className="feedback-grid">
                <Card style={{ padding: "22px", borderRadius: "24px" }}>
                  <h3 className="feedback-title blue">Points forts</h3>
                  <p className="feedback-text">
                    {latestFeedback?.strengths || "Aucun point fort disponible."}
                  </p>
                </Card>

                <Card style={{ padding: "22px", borderRadius: "24px" }}>
                  <h3 className="feedback-title orange">Axes d’amélioration</h3>
                  <p className="feedback-text">
                    {latestFeedback?.weaknesses ||
                      "Aucun axe d’amélioration disponible."}
                  </p>
                </Card>

                <Card style={{ padding: "22px", borderRadius: "24px" }}>
                  <h3 className="feedback-title green">Conseil final</h3>
                  <p className="feedback-text">
                    {latestFeedback?.final_advice ||
                      "Aucun conseil final disponible."}
                  </p>
                </Card>
              </div>
            </section>
          )}
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #ffffff 100%);
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

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .history-layout {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 16px;
        }

        .history-title {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 20px;
          font-weight: 900;
        }

        .history-text {
          margin: 0 0 20px;
          color: #64748b;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 500;
        }

        .progress-list {
          display: grid;
          gap: 14px;
        }

        .progress-card {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          background: #ffffff;
        }

        .progress-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .progress-title {
          margin: 0;
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
        }

        .progress-subtitle {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .progress-score {
          color: #2563eb;
          font-size: 15px;
          font-weight: 900;
          white-space: nowrap;
        }

        .progress-bar-track {
          width: 100%;
          height: 10px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #60a5fa, #2563eb);
        }

        .history-placeholder {
          display: grid;
          gap: 18px;
        }

        .history-point {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .history-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #2563eb;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .history-item-title {
          margin: 0 0 4px;
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
        }

        .history-item-text {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
        }

        .feedback-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .feedback-title {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 800;
        }

        .feedback-title.blue {
          color: #1d4ed8;
        }

        .feedback-title.orange {
          color: #c2410c;
        }

        .feedback-title.green {
          color: #15803d;
        }

        .feedback-text {
          margin: 0;
          color: #475569;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 500;
          white-space: pre-line;
          word-break: break-word;
        }

        @media (max-width: 900px) {
          .page-shell {
            padding: 28px 18px 48px;
          }

          .page-container {
            max-width: 100%;
          }

          .history-layout {
            grid-template-columns: 1fr;
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

          .stats-grid,
          .feedback-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}