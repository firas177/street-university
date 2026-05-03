"use client";

import { useEffect, useMemo, useState } from "react";
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
  if (value === null || value === undefined || value === "") return "0";

  const num = Number(value);

  if (Number.isNaN(num)) return "0";

  return Number.isInteger(num) ? String(num) : num.toFixed(1);
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

function formatSentimentLabel(value) {
  if (!value) return "Non disponible";

  const normalized = String(value).toLowerCase();

  if (normalized === "positive") return "Positif";
  if (normalized === "negative") return "Négatif";
  if (normalized === "neutral") return "Neutre";

  return value;
}

function formatVoiceScore(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const num = Number(value);

  if (Number.isNaN(num)) return "N/A";

  if (num > 0) return `+${num.toFixed(1)}`;
  return num.toFixed(1);
}

function getSentimentClass(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "positive") return "positive";
  if (normalized === "negative") return "negative";
  if (normalized === "neutral") return "neutral";

  return "empty";
}

function getSentimentImpactText(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "positive") {
    return "Le sentiment positif a été utilisé pour renforcer légèrement les scores liés à la confiance, la communication et le professionnalisme.";
  }

  if (normalized === "negative") {
    return "Le sentiment négatif peut indiquer du stress, de l’hésitation ou un manque de confiance. Il est utilisé avec prudence dans l’évaluation.";
  }

  if (normalized === "neutral") {
    return "Le sentiment neutre indique une posture stable, sans signal émotionnel fortement positif ou négatif.";
  }

  return "Aucun signal vocal exploitable n’a été détecté pour cette session.";
}

const DEFAULT_SENTIMENT_MODEL =
  "lxyuan/distilbert-base-multilingual-cased-sentiments-student";

const SENTIMENT_IMPACT_RATING =
  "Cette analyse complète le feedback IA et ajuste légèrement les scores de confiance, communication et professionnalisme.";

function formatSentimentConfidence(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num.toFixed(2);
}

function findLatestUserSentimentMessage(msgs) {
  if (!Array.isArray(msgs)) return null;
  for (let i = msgs.length - 1; i >= 0; i -= 1) {
    const m = msgs[i];
    if (m.role !== "user") continue;
    if (
      m.sentiment_label ||
      (m.sentiment_score !== undefined && m.sentiment_score !== null) ||
      (m.sentiment_confidence !== undefined && m.sentiment_confidence !== null) ||
      m.sentiment_source ||
      m.sentiment_model
    ) {
      return m;
    }
  }
  return null;
}

function resolveSentimentSourceDisplay(feedback, msg) {
  const vt = feedback?.voice_transcription;
  if (typeof vt === "string" && vt.trim()) {
    const t = vt.trim();
    return t.length > 180 ? `${t.slice(0, 177)}…` : t;
  }
  const s = msg?.sentiment_source || feedback?.sentiment_source;
  if (typeof s === "string" && s.trim()) return s.trim();
  return "Transcription vocale";
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

  const latestSentimentMessage = useMemo(
    () => findLatestUserSentimentMessage(messages),
    [messages]
  );

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
              <section
                className="sentiment-model-card"
                aria-labelledby="perf-sentiment-model-title"
              >
                <header className="jury-head">
                  <p className="jury-eyebrow">Modèle de sentiment</p>
                  <h2 id="perf-sentiment-model-title" className="jury-title">
                    Résultat du modèle de sentiment
                  </h2>
                  <p className="jury-lead">
                    Synthèse lisible pour le jury : scores vocaux, confiance du
                    modèle, source des données et résumé automatique.
                  </p>
                </header>
                <dl className="jury-grid">
                  <div className="jury-row">
                    <dt>Sentiment détecté</dt>
                    <dd>
                      <span
                        className={`sentiment-label-badge ${getSentimentClass(
                          feedback.voice_sentiment_label ||
                            latestSentimentMessage?.sentiment_label
                        )}`}
                      >
                        {formatSentimentLabel(
                          feedback.voice_sentiment_label ||
                            latestSentimentMessage?.sentiment_label
                        )}
                      </span>
                    </dd>
                  </div>
                  <div className="jury-row">
                    <dt>Score sentiment</dt>
                    <dd className="jury-value-strong">
                      {formatVoiceScore(
                        feedback.voice_sentiment_score ??
                          latestSentimentMessage?.sentiment_score
                      )}
                    </dd>
                  </div>
                  <div className="jury-row">
                    <dt>Confiance du modèle</dt>
                    <dd>
                      {(() => {
                        const c =
                          latestSentimentMessage?.sentiment_confidence ??
                          feedback.voice_sentiment_confidence ??
                          feedback.sentiment_confidence;
                        const f = formatSentimentConfidence(c);
                        return f !== null ? f : "Non disponible";
                      })()}
                    </dd>
                  </div>
                  <div className="jury-row">
                    <dt>Source</dt>
                    <dd className="jury-value-multiline">
                      {resolveSentimentSourceDisplay(
                        feedback,
                        latestSentimentMessage
                      )}
                    </dd>
                  </div>
                  <div className="jury-row">
                    <dt>Modèle</dt>
                    <dd className="jury-value-code">
                      {latestSentimentMessage?.sentiment_model ||
                        feedback.sentiment_model ||
                        DEFAULT_SENTIMENT_MODEL}
                    </dd>
                  </div>
                  <div className="jury-row jury-row-span">
                    <dt>Résumé</dt>
                    <dd className="jury-value-multiline">
                      {feedback.voice_sentiment_summary || "Non disponible"}
                    </dd>
                  </div>
                  <div className="jury-row jury-row-span jury-impact">
                    <dt>Impact sur le rating</dt>
                    <dd className="jury-value-multiline">
                      {SENTIMENT_IMPACT_RATING}
                    </dd>
                  </div>
                </dl>
                <div className="jury-footnote">
                  <p>
                    Interprétation complémentaire :{" "}
                    {getSentimentImpactText(feedback.voice_sentiment_label)}
                  </p>
                </div>
              </section>
            )}

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
                    const confStr = formatSentimentConfidence(
                      message.sentiment_confidence
                    );
                    const showVoiceSentimentBadge =
                      isUser &&
                      (message.sentiment_label || confStr !== null);

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

                          {showVoiceSentimentBadge && (
                            <div
                              className={`message-voice-badge ${getSentimentClass(
                                message.sentiment_label
                              )}`}
                            >
                              Sentiment vocal :{" "}
                              {message.sentiment_label
                                ? formatSentimentLabel(message.sentiment_label)
                                : "Indéterminé"}
                              {confStr !== null ? ` · confiance ${confStr}` : ""}
                            </div>
                          )}

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
          appearance: none;
          font-family: inherit;
          border-radius: 999px;
          padding: 14px 22px;
          font-size: 16px;
          font-weight: 850;
          cursor: pointer;
        }

        .loading-card,
        .hero-card,
        .scores-card,
        .conversation-card,
        .sentiment-model-card {
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

        .scores-card,
        .sentiment-model-card {
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

        .sentiment-model-card {
          padding: 26px;
          border-radius: 28px;
        }

        .jury-head {
          margin-bottom: 20px;
        }

        .jury-eyebrow {
          margin: 0 0 8px;
          color: #2563eb;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .jury-title {
          margin: 0;
          color: #0f172a;
          font-size: clamp(20px, 2.4vw, 28px);
          font-weight: 950;
          line-height: 1.15;
        }

        .jury-lead {
          margin: 12px 0 0;
          color: #475569;
          font-size: 16px;
          line-height: 1.7;
          max-width: 900px;
        }

        .jury-grid {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .jury-row {
          display: grid;
          grid-template-columns: minmax(160px, 220px) minmax(0, 1fr);
          gap: 14px 18px;
          align-items: center;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .jury-row-span {
          grid-template-columns: 1fr;
          align-items: start;
        }

        .jury-row-span dt {
          margin-bottom: 4px;
        }

        .jury-impact {
          border-color: #bae6fd;
          background: #f0f9ff;
        }

        .jury-row dt {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          font-weight: 800;
        }

        .jury-row dd {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
          line-height: 1.65;
        }

        .jury-value-strong {
          font-size: 20px;
          font-weight: 950;
        }

        .jury-value-multiline {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .jury-value-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 14px;
          line-height: 1.55;
          color: #1e293b;
        }

        .sentiment-label-badge {
          display: inline-flex;
          align-items: center;
          min-height: 36px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 900;
        }

        .sentiment-label-badge.positive {
          color: #14532d;
          background: #bbf7d0;
          border: 1px solid #4ade80;
        }

        .sentiment-label-badge.negative {
          color: #7f1d1d;
          background: #fecaca;
          border: 1px solid #f87171;
        }

        .sentiment-label-badge.neutral {
          color: #1e293b;
          background: #e2e8f0;
          border: 1px solid #94a3b8;
        }

        .sentiment-label-badge.empty {
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
        }

        .jury-footnote {
          margin-top: 18px;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .jury-footnote p {
          margin: 0;
          color: #475569;
          font-size: 15px;
          line-height: 1.7;
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

        .message-voice-badge {
          margin-top: 10px;
          width: fit-content;
          max-width: 100%;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.4;
        }

        .message-bubble.user .message-voice-badge.positive {
          background: rgba(255, 255, 255, 0.95);
          color: #14532d;
          border: 1px solid #86efac;
        }

        .message-bubble.user .message-voice-badge.negative {
          background: rgba(255, 255, 255, 0.95);
          color: #7f1d1d;
          border: 1px solid #fca5a5;
        }

        .message-bubble.user .message-voice-badge.neutral {
          background: rgba(255, 255, 255, 0.92);
          color: #1e293b;
          border: 1px solid #cbd5e1;
        }

        .message-bubble.user .message-voice-badge.empty {
          background: rgba(255, 255, 255, 0.88);
          color: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .message-bubble.assistant .message-voice-badge.positive {
          color: #14532d;
          background: #bbf7d0;
          border: 1px solid #4ade80;
        }

        .message-bubble.assistant .message-voice-badge.negative {
          color: #7f1d1d;
          background: #fecaca;
          border: 1px solid #f87171;
        }

        .message-bubble.assistant .message-voice-badge.neutral {
          color: #1e293b;
          background: #e2e8f0;
          border: 1px solid #94a3b8;
        }

        .message-bubble.assistant .message-voice-badge.empty {
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
        }

        .message-bubble p {
          margin: 8px 0;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .message-bubble span {
          display: block;
          font-size: 14px;
          line-height: 1.4;
          color: #64748b;
        }

        .message-bubble.user span {
          color: rgba(255, 255, 255, 0.88);
        }

        .page-root {
          background:
            radial-gradient(circle at 10% 0%, rgba(37, 99, 235, 0.28), transparent 30%),
            radial-gradient(circle at 88% 10%, rgba(124, 58, 237, 0.22), transparent 30%),
            linear-gradient(180deg, #030712 0%, #0f172a 55%, #eef4ff 100%);
        }

        .performance-shell {
          max-width: 1280px;
          padding: 34px 20px 72px;
        }

        .loading-card,
        .hero-card,
        .scores-card,
        .conversation-card,
        .sentiment-model-card,
        .analysis-card,
        .stat-card {
          border: 1px solid rgba(147, 197, 253, 0.22);
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.52)),
            rgba(255, 255, 255, 0.08);
          box-shadow:
            0 28px 90px rgba(2, 6, 23, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .jury-eyebrow {
          color: #93c5fd;
        }

        .jury-title {
          color: #ffffff;
        }

        .jury-lead {
          color: #dbeafe;
        }

        .jury-row {
          border-color: rgba(147, 197, 253, 0.22);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(96, 165, 250, 0.06)),
            rgba(15, 23, 42, 0.35);
        }

        .jury-impact {
          border-color: rgba(34, 211, 238, 0.35);
          background: rgba(8, 47, 73, 0.45);
        }

        .jury-row dt {
          color: #bfdbfe;
        }

        .jury-row dd,
        .jury-value-strong {
          color: #f1f5f9;
        }

        .jury-value-code {
          color: #e0f2fe;
        }

        .jury-footnote {
          border-color: rgba(147, 197, 253, 0.22);
          background: rgba(15, 23, 42, 0.4);
        }

        .jury-footnote p {
          color: #dbeafe;
        }

        .sentiment-label-badge.empty {
          color: #e2e8f0;
          background: rgba(15, 23, 42, 0.55);
          border-color: rgba(148, 163, 184, 0.45);
        }

        .secondary-btn {
          border: 1px solid rgba(147, 197, 253, 0.3);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(96, 165, 250, 0.08));
          color: #f8fafc;
          min-height: 50px;
          box-shadow: 0 12px 32px rgba(2, 6, 23, 0.2);
          transition: transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .secondary-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(34, 211, 238, 0.55);
        }

        .secondary-btn:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .loading-card h1,
        .hero-card h1,
        .section-title h2,
        .score-item strong,
        .analysis-card h3,
        .stat-card strong {
          color: #f8fafc;
        }

        .description,
        .loading-card p,
        .score-item p,
        .analysis-card p,
        .message-bubble p,
        .empty-box {
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.75;
        }

        .eyebrow,
        .stat-card span,
        .score-item span {
          color: #93c5fd;
          font-size: 13px;
        }

        .global-score-card,
        .score-item,
        .empty-box {
          border: 1px solid rgba(147, 197, 253, 0.18);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(96, 165, 250, 0.06)),
            rgba(15, 23, 42, 0.24);
        }

        .global-score-card strong {
          color: #ffffff;
        }

        .badges span {
          background: rgba(96, 165, 250, 0.16);
          color: #dbeafe;
          border-color: rgba(147, 197, 253, 0.32);
          font-size: 14px;
        }

        .message-bubble {
          font-size: 16px;
          line-height: 1.75;
        }

        .message-bubble.assistant {
          background: rgba(255, 255, 255, 0.95);
          color: #0f172a;
        }

        .message-bubble.assistant p {
          color: #334155;
        }

        .message-bubble.user {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }

        .message-voice-badge {
          font-size: 13px;
          line-height: 1.35;
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
          .conversation-card,
          .sentiment-model-card {
            padding: 20px;
            border-radius: 22px;
          }

          .jury-row {
            grid-template-columns: 1fr;
          }

          .hero-card h1 {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}
