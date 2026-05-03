"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Alert from "../../components/ui/Alert";
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
          <h3>{label}</h3>
          <p>{level}</p>
        </div>
        <span>{display}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
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

  const metrics = [
    ["Communication", communicationAverage],
    ["Confiance", confidenceAverage],
    ["Clarté", clarityAverage],
    ["Pertinence", relevanceAverage],
    ["Professionnalisme", professionalismAverage],
  ];

  return (
    <>
      <Navbar />

      <main className="premium-page">
        <div className="page-container">
          {error && (
            <Alert type="error" style={{ marginBottom: "18px" }}>
              {error}
            </Alert>
          )}

          <section className="hero">
            <div>
              <p className="eyebrow">Performance réelle</p>
              <h1>{loading ? "Chargement des performances..." : "Mes performances détaillées"}</h1>
              <p>
                Consulte tes scores réels, tes indicateurs par compétence et le
                dernier feedback généré par l'IA.
              </p>
            </div>
            <button type="button" className="hero-back-btn" onClick={() => router.push("/dashboard")}>
              Retour au dashboard
            </button>
          </section>

          {!loading && !hasPerformance && (
            <section className="empty-card">
              <p className="eyebrow">Aperçu global</p>
              <h2>Aucune performance réelle disponible</h2>
              <p>
                Termine une session évaluée pour voir apparaître tes statistiques
                détaillées.
              </p>
            </section>
          )}

          {!loading && hasPerformance && (
            <>
              <section className="summary-grid">
                <article className="summary-card hero-score">
                  <span>Score global moyen</span>
                  <strong>{formatScore(averageScore)}</strong>
                  <p>Moyenne globale des sessions notées.</p>
                </article>
                <article className="summary-card">
                  <span>Meilleur score</span>
                  <strong>{formatScore(bestScore)}</strong>
                  <p>Meilleure performance obtenue.</p>
                </article>
                <article className="summary-card">
                  <span>Sessions évaluées</span>
                  <strong>{completedRatedSessions}</strong>
                  <p>Sessions avec feedback IA.</p>
                </article>
              </section>

              <section className="section-heading">
                <p className="eyebrow">Progression</p>
                <h2>Niveau actuel par compétence</h2>
              </section>

              <section className="progress-layout">
                <div className="progress-list">
                  {metrics.map(([label, value]) => (
                    <ProgressItem key={label} label={label} value={value} />
                  ))}
                </div>

                <article className="timeline-card">
                  <p className="eyebrow">Historique</p>
                  <h3>État actuel</h3>
                  <div className="timeline-item">
                    <span />
                    <p>Score moyen actuel : {formatScore(averageScore)}</p>
                  </div>
                  <div className="timeline-item">
                    <span />
                    <p>Meilleur score observé : {formatScore(bestScore)}</p>
                  </div>
                  <div className="timeline-item">
                    <span />
                    <p>Prochaine étape : compléter plus de simulations évaluées.</p>
                  </div>
                </article>
              </section>

              <section className="section-heading">
                <p className="eyebrow">Feedback</p>
                <h2>Dernier feedback IA</h2>
              </section>

              <section className="feedback-grid">
                <article>
                  <span className="token success">Points forts</span>
                  <p>{latestFeedback?.strengths || "Aucun point fort disponible."}</p>
                </article>
                <article>
                  <span className="token warning">Axes d'amélioration</span>
                  <p>
                    {latestFeedback?.weaknesses ||
                      "Aucun axe d'amélioration disponible."}
                  </p>
                </article>
                <article>
                  <span className="token blue">Conseil final</span>
                  <p>
                    {latestFeedback?.final_advice ||
                      "Aucun conseil final disponible."}
                  </p>
                </article>
              </section>
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        .premium-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 0%, rgba(37, 99, 235, 0.3), transparent 30%),
            radial-gradient(circle at 90% 10%, rgba(124, 58, 237, 0.22), transparent 30%),
            linear-gradient(180deg, #030712 0%, #0f172a 58%, #eef4ff 100%);
          padding: 34px 20px 76px;
          color: #f8fafc;
        }

        .page-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .hero,
        .empty-card,
        .summary-card,
        .progress-list,
        .timeline-card,
        .feedback-grid article {
          border: 1px solid rgba(147, 197, 253, 0.22);
          border-radius: 30px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.52)),
            rgba(255, 255, 255, 0.08);
          box-shadow: 0 28px 90px rgba(2, 6, 23, 0.28);
          backdrop-filter: blur(18px);
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          padding: 34px;
          margin-bottom: 20px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #93c5fd;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          font-size: clamp(40px, 6vw, 68px);
          line-height: 0.98;
          font-weight: 950;
        }

        .hero p,
        .empty-card p,
        .summary-card p,
        .timeline-card p,
        .feedback-grid p {
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.75;
        }

        .hero-back-btn {
          appearance: none;
          font-family: inherit;
          flex-shrink: 0;
          min-height: 52px;
          border-radius: 999px;
          padding: 14px 22px;
          border: 1px solid rgba(147, 197, 253, 0.35);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(96, 165, 250, 0.1));
          color: #f8fafc;
          font-size: 16px;
          font-weight: 950;
          cursor: pointer;
          backdrop-filter: blur(12px);
          box-shadow: 0 14px 36px rgba(2, 6, 23, 0.25);
          transition: transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .hero-back-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(34, 211, 238, 0.6);
        }

        .hero-back-btn:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .empty-card,
        .timeline-card {
          padding: 28px;
        }

        .empty-card h2,
        .section-heading h2,
        .timeline-card h3 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.1;
          font-weight: 950;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 18px;
          margin-bottom: 28px;
        }

        .summary-card {
          padding: 24px;
        }

        .summary-card span {
          color: #93c5fd;
          font-size: 15px;
          font-weight: 900;
        }

        .summary-card strong {
          display: block;
          margin-top: 12px;
          color: #ffffff;
          font-size: clamp(34px, 5vw, 56px);
          line-height: 1;
          font-weight: 950;
        }

        .section-heading {
          margin: 30px 0 16px;
        }

        .progress-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.8fr);
          gap: 18px;
        }

        .progress-list {
          display: grid;
          gap: 14px;
          padding: 20px;
        }

        .progress-card {
          border: 1px solid rgba(147, 197, 253, 0.18);
          border-radius: 20px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.08);
        }

        .progress-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }

        .progress-card h3 {
          margin: 0;
          color: #ffffff;
          font-size: 17px;
          font-weight: 950;
        }

        .progress-card p {
          margin: 5px 0 0;
          color: #c7d2fe;
          font-size: 15px;
        }

        .progress-card span {
          color: #e0f2fe;
          font-size: 16px;
          font-weight: 950;
        }

        .progress-track {
          height: 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.13);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #22d3ee, #16a34a);
        }

        .timeline-item {
          display: grid;
          grid-template-columns: 14px 1fr;
          gap: 12px;
          margin-top: 18px;
        }

        .timeline-item span {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #22d3ee;
          margin-top: 8px;
        }

        .feedback-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .feedback-grid article {
          padding: 22px;
        }

        .token {
          display: inline-flex;
          min-height: 32px;
          align-items: center;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 950;
        }

        .token.success {
          background: #dcfce7;
          color: #166534;
        }

        .token.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .token.blue {
          background: #dbeafe;
          color: #1d4ed8;
        }

        @media (max-width: 980px) {
          .hero,
          .summary-grid,
          .progress-layout,
          .feedback-grid {
            grid-template-columns: 1fr;
          }

          .hero {
            flex-direction: column;
          }

          .hero-back-btn {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .premium-page {
            padding: 20px 12px 46px;
          }

          .hero,
          .empty-card,
          .summary-card,
          .progress-list,
          .timeline-card,
          .feedback-grid article {
            border-radius: 24px;
            padding: 22px;
          }

          h1 {
            font-size: 38px;
          }
        }
      `}</style>
    </>
  );
}
