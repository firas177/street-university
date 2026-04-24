"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { getSessionById, getSessionFeedback } from "../../../lib/api";

function formatDate(value) {
  if (!value) return "Non disponible";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Date invalide";
  }
}

function formatScore(value) {
  if (value === null || value === undefined) return "0";
  return String(value);
}

function formatDuration(seconds) {
  const safeSeconds = Number(seconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;

  if (minutes <= 0) return `${rest} sec`;
  if (rest === 0) return `${minutes} min`;

  return `${minutes} min ${rest} sec`;
}

function getReasonLabel(reason) {
  if (reason === "timeout") return "Temps terminé";
  if (reason === "manual") return "Terminée manuellement";
  if (reason === "exit_intent") return "Arrêt demandé par l’utilisateur";
  return "Non précisée";
}

export default function SessionPerformancePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id;

  const [sessionData, setSessionData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPerformance() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        if (!sessionId) return;

        setLoading(true);
        setError("");

        const session = await getSessionById(token, sessionId);
        setSessionData(session);

        if (session?.feedback) {
          setFeedback(session.feedback);
        } else {
          const feedbackData = await getSessionFeedback(token, sessionId);
          setFeedback(feedbackData);
        }
      } catch (err) {
        console.error("Session performance loading error:", err);
        setError(
          err?.message ||
            "Impossible de charger la performance de cette session."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPerformance();
  }, [router, sessionId]);

  const scenario = sessionData?.scenario;
  const messages = sessionData?.messages || [];

  const userMessagesCount = messages.filter((msg) => msg.role === "user").length;
  const assistantMessagesCount = messages.filter(
    (msg) => msg.role === "assistant"
  ).length;

  return (
    <div className="page-root">
      <Navbar />

      <main className="performance-shell">
        <div className="top-actions">
          <button
            type="button"
            onClick={() => router.push(`/session/${sessionId}`)}
            className="secondary-btn"
          >
            Retour à la session
          </button>

          <button
            type="button"
            onClick={() => router.push("/sessions")}
            className="secondary-btn"
          >
            Mes sessions
          </button>
        </div>

        {loading && (
          <div className="loading-card">
            <h1>Chargement de la performance...</h1>
            <p>Nous récupérons les détails de cette session.</p>
          </div>
        )}

        {error && !loading && <div className="error-box">{error}</div>}

        {!loading && sessionData && (
          <>
            <section className="hero-card">
              <div>
                <p className="eyebrow">Performance de session</p>
                <h1>{scenario?.title || "Session"}</h1>

                <p className="description">
                  Analyse détaillée de votre simulation, basée sur vos réponses,
                  votre communication et votre interaction avec l’agent.
                </p>

                <div className="badges">
                  <span>{scenario?.category || "Sans catégorie"}</span>
                  <span>{sessionData?.status || "unknown"}</span>
                  <span>{getReasonLabel(sessionData?.completion_reason)}</span>
                </div>
              </div>

              <div className="global-score-card">
                <span>Score global</span>
                <strong>{formatScore(feedback?.overall_score)}/10</strong>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span>Durée prévue</span>
                <strong>{formatDuration(sessionData?.duration_seconds)}</strong>
              </div>

              <div className="stat-card">
                <span>Début</span>
                <strong>{formatDate(sessionData?.started_at)}</strong>
              </div>

              <div className="stat-card">
                <span>Fin</span>
                <strong>{formatDate(sessionData?.completed_at)}</strong>
              </div>

              <div className="stat-card">
                <span>Messages utilisateur</span>
                <strong>{userMessagesCount}</strong>
              </div>

              <div className="stat-card">
                <span>Messages assistant</span>
                <strong>{assistantMessagesCount}</strong>
              </div>
            </section>

            <section className="scores-card">
              <div className="section-title">
                <p className="eyebrow">Évaluation</p>
                <h2>Scores détaillés</h2>
              </div>

              {feedback ? (
                <div className="score-grid">
                  <div className="score-item">
                    <span>Communication</span>
                    <strong>{formatScore(feedback.communication_score)}/10</strong>
                    <p>Qualité de l’expression et capacité à répondre clairement.</p>
                  </div>

                  <div className="score-item">
                    <span>Confiance</span>
                    <strong>{formatScore(feedback.confidence_score)}/10</strong>
                    <p>Assurance ressentie dans les réponses.</p>
                  </div>

                  <div className="score-item">
                    <span>Clarté</span>
                    <strong>{formatScore(feedback.clarity_score)}/10</strong>
                    <p>Structure, précision et facilité de compréhension.</p>
                  </div>

                  <div className="score-item">
                    <span>Pertinence</span>
                    <strong>{formatScore(feedback.relevance_score)}/10</strong>
                    <p>Adéquation entre les réponses et le scénario.</p>
                  </div>

                  <div className="score-item">
                    <span>Professionnalisme</span>
                    <strong>
                      {formatScore(feedback.professionalism_score)}/10
                    </strong>
                    <p>Ton, posture et sérieux dans la simulation.</p>
                  </div>
                </div>
              ) : (
                <div className="empty-box">
                  Aucun feedback n’est encore disponible pour cette session.
                </div>
              )}
            </section>

            {feedback && (
              <section className="analysis-grid">
                <div className="analysis-card">
                  <h3>Points forts</h3>
                  <p>
                    {feedback.strengths ||
                      "Aucun point fort spécifique détecté pour le moment."}
                  </p>
                </div>

                <div className="analysis-card">
                  <h3>Points à améliorer</h3>
                  <p>
                    {feedback.weaknesses ||
                      "Aucun point faible spécifique détecté pour le moment."}
                  </p>
                </div>

                <div className="analysis-card full">
                  <h3>Conseil final</h3>
                  <p>
                    {feedback.final_advice ||
                      "Aucun conseil final disponible pour le moment."}
                  </p>
                </div>
              </section>
            )}

            <section className="conversation-card">
              <div className="section-title">
                <p className="eyebrow">Historique</p>
                <h2>Conversation de la session</h2>
              </div>

              {messages.length === 0 ? (
                <div className="empty-box">Aucun message trouvé.</div>
              ) : (
                <div className="messages-list">
                  {messages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={message.id}
                        className={`message-row ${isUser ? "user" : "assistant"}`}
                      >
                        <div
                          className={`message-bubble ${
                            isUser ? "user" : "assistant"
                          }`}
                        >
                          <strong>{isUser ? "Vous" : "Assistant"}</strong>
                          <p>{message.content}</p>
                          <span>{formatDate(message.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        .page-root {
          min-height: 100vh;
          background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
        }

        .performance-shell {
          max-width: 1180px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        .top-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .secondary-btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 800;
          cursor: pointer;
        }

        .loading-card,
        .hero-card,
        .scores-card,
        .conversation-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        }

        .loading-card h1 {
          margin: 0;
          color: #0f172a;
        }

        .loading-card p {
          color: #64748b;
        }

        .error-box {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 20px;
          padding: 16px;
          font-weight: 700;
        }

        .hero-card {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 900;
          font-size: 13px;
        }

        .hero-card h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1;
        }

        .description {
          color: #475569;
          line-height: 1.7;
          max-width: 720px;
          margin: 16px 0 0;
        }

        .badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .badges span {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 800;
        }

        .global-score-card {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          border-radius: 24px;
          padding: 22px;
          min-width: 190px;
          text-align: center;
        }

        .global-score-card span {
          display: block;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .global-score-card strong {
          font-size: 42px;
          font-weight: 950;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
        }

        .stat-card span {
          display: block;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .stat-card strong {
          color: #0f172a;
          font-size: 20px;
          font-weight: 900;
        }

        .scores-card {
          margin-bottom: 20px;
        }

        .section-title {
          margin-bottom: 18px;
        }

        .section-title h2 {
          margin: 0;
          color: #0f172a;
          font-size: 28px;
        }

        .score-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }

        .score-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 18px;
        }

        .score-item span {
          display: block;
          color: #64748b;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .score-item strong {
          color: #0f172a;
          font-size: 32px;
          font-weight: 950;
        }

        .score-item p {
          color: #475569;
          line-height: 1.6;
          margin: 10px 0 0;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .analysis-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
        }

        .analysis-card.full {
          grid-column: 1 / -1;
        }

        .analysis-card h3 {
          margin: 0 0 12px;
          color: #0f172a;
          font-size: 22px;
        }

        .analysis-card p {
          margin: 0;
          color: #475569;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .conversation-card {
          margin-bottom: 20px;
        }

        .empty-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          border-radius: 16px;
          padding: 16px;
          line-height: 1.7;
        }

        .messages-list {
          display: grid;
          gap: 14px;
        }

        .message-row {
          display: flex;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.assistant {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 78%;
          border-radius: 20px;
          padding: 16px;
          word-break: break-word;
        }

        .message-bubble.user {
          background: #0f172a;
          color: #ffffff;
        }

        .message-bubble.assistant {
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }

        .message-bubble p {
          margin: 8px 0;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .message-bubble span {
          display: block;
          font-size: 12px;
          opacity: 0.75;
        }

        @media (max-width: 800px) {
          .hero-card {
            flex-direction: column;
          }

          .global-score-card {
            width: 100%;
          }

          .analysis-grid {
            grid-template-columns: 1fr;
          }

          .message-bubble {
            max-width: 100%;
          }
        }

        @media (max-width: 640px) {
          .performance-shell {
            padding: 22px 12px 50px;
          }

          .top-actions {
            justify-content: stretch;
          }

          .secondary-btn {
            width: 100%;
          }

          .hero-card,
          .scores-card,
          .conversation-card {
            padding: 20px;
            border-radius: 22px;
          }

          .hero-card h1 {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}