"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import VoiceMessageBox from "../../components/ui/VoiceMessageBox";
import {
  getSessionById,
  sendSessionMessage,
  completeSession,
  sendVoiceMessage,
  getSessionFeedback,
} from "../../lib/api";

function formatTimer(seconds) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function calculateRemainingSeconds(session) {
  if (!session) return 0;

  if (typeof session.remaining_seconds === "number") {
    return Math.max(0, session.remaining_seconds);
  }

  if (session.expires_at) {
    const expiresAt = new Date(session.expires_at).getTime();
    const now = Date.now();

    if (!Number.isNaN(expiresAt)) {
      return Math.max(0, Math.floor((expiresAt - now) / 1000));
    }
  }

  if (typeof session.duration_seconds === "number") {
    return session.duration_seconds;
  }

  return 900;
}

function formatScore(value) {
  if (value === null || value === undefined) return "0";
  return String(value);
}

const DEFAULT_SENTIMENT_MODEL =
  "lxyuan/distilbert-base-multilingual-cased-sentiments-student";

function formatSentimentLabel(value) {
  if (!value) return "Non disponible";
  const normalized = String(value).toLowerCase();
  if (normalized === "positive") return "Positif";
  if (normalized === "negative") return "Négatif";
  if (normalized === "neutral") return "Neutre";
  return String(value);
}

function formatVoiceSentimentScore(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  if (num > 0) return `+${num.toFixed(1)}`;
  return num.toFixed(1);
}

function formatSentimentConfidence(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num.toFixed(2);
}

function getSentimentToneClass(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "positive") return "positive";
  if (normalized === "negative") return "negative";
  if (normalized === "neutral") return "neutral";
  return "empty";
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

const SENTIMENT_IMPACT_RATING =
  "Cette analyse complète le feedback IA et ajuste légèrement les scores de confiance, communication et professionnalisme.";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id;

  const expireCalledRef = useRef(false);

  const [sessionData, setSessionData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [voiceTranscription, setVoiceTranscription] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceSuccess, setVoiceSuccess] = useState("");

  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const latestSentimentMessage = useMemo(
    () => findLatestUserSentimentMessage(messages),
    [messages]
  );

  const status = sessionData?.status || "unknown";

  const timerFinished =
    Boolean(sessionData?.expires_at) &&
    remainingSeconds !== null &&
    Number(remainingSeconds) <= 0;

  const isCompleted =
    status === "completed" || sessionData?.is_expired || timerFinished;

  const loadFeedback = useCallback(async (token, currentSessionId) => {
    try {
      setFeedbackLoading(true);
      setFeedbackError("");

      const data = await getSessionFeedback(token, currentSessionId);
      setFeedback(data);
    } catch (err) {
      console.error("Feedback loading error:", err);
      setFeedbackError(
        err?.message || "Impossible de récupérer le feedback de la session."
      );
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        if (!sessionId) return;

        const data = await getSessionById(token, sessionId);
        const initialRemaining = calculateRemainingSeconds(data);

        setSessionData(data);
        setMessages(data?.messages || []);
        setRemainingSeconds(initialRemaining);

        if (data?.feedback) {
          setFeedback(data.feedback);
        }

        if (data?.status === "completed" || data?.is_expired) {
          setSuccessMessage("Cette session est terminée.");

          if (!data?.feedback) {
            await loadFeedback(token, sessionId);
          }
        }
      } catch (err) {
        setError(err?.message || "Erreur lors du chargement de la session");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [router, sessionId, loadFeedback]);

  useEffect(() => {
    if (!sessionData) return;
    if (status !== "active") return;
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        return Math.max(0, Number(prev || 0) - 1);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData, status, remainingSeconds]);

  useEffect(() => {
    async function expireSessionAutomatically() {
      if (!sessionData) return;
      if (status !== "active") return;
      if (remainingSeconds === null) return;
      if (remainingSeconds > 0) return;
      if (expireCalledRef.current) return;

      expireCalledRef.current = true;

      try {
        setCompleting(true);
        setError("");
        setVoiceError("");
        setSuccessMessage("Temps terminé. La session est clôturée.");

        const token = localStorage.getItem("token");

        setSessionData((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                is_expired: true,
                remaining_seconds: 0,
                completion_reason: "timeout",
              }
            : prev
        );

        if (token && sessionId) {
          await completeSession(token, sessionId);

          const freshSession = await getSessionById(token, sessionId);

          setSessionData(freshSession);
          setMessages(freshSession?.messages || []);
          setRemainingSeconds(0);

          if (freshSession?.feedback) {
            setFeedback(freshSession.feedback);
          } else {
            await loadFeedback(token, sessionId);
          }
        }
      } catch (err) {
        console.error("Auto complete session error:", err);
        setSuccessMessage("Temps terminé. La session est clôturée localement.");
      } finally {
        setCompleting(false);
      }
    }

    expireSessionAutomatically();
  }, [remainingSeconds, sessionData, status, sessionId, loadFeedback]);

  const timerProgress = (() => {
    const duration = Number(sessionData?.duration_seconds || 1);
    const remaining = Number(remainingSeconds || 0);

    return Math.max(0, Math.min(100, (remaining / duration) * 100));
  })();

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    if (!sessionData || status !== "active" || remainingSeconds <= 0) {
      setError("La session est terminée. Tu ne peux plus envoyer de message.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccessMessage("");
      setVoiceError("");
      setVoiceSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const currentContent = content.trim();

      const userMessage = {
        id: `temp-user-${Date.now()}`,
        session_id: sessionId,
        role: "user",
        content: currentContent,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setContent("");

      const result = await sendSessionMessage(token, sessionId, currentContent);

      if (result?.messages) {
        setSessionData(result);
        setMessages(result.messages || []);
        setRemainingSeconds(calculateRemainingSeconds(result));

        if (result?.feedback) {
          setFeedback(result.feedback);
        }
      } else {
        setMessages((prev) => [...prev, result]);
      }

      setSuccessMessage("Message envoyé avec succès.");

      if (result?.status === "completed" || result?.is_expired) {
        setSessionData((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                is_expired: true,
                remaining_seconds: 0,
              }
            : prev
        );

        setRemainingSeconds(0);

        if (!result?.feedback) {
          await loadFeedback(token, sessionId);
        }
      }
    } catch (err) {
      if (err?.message === "SESSION_EXPIRED") {
        setSessionData((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                is_expired: true,
                remaining_seconds: 0,
                completion_reason: "timeout",
              }
            : prev
        );

        setRemainingSeconds(0);
        setError("Temps terminé. La session a été clôturée automatiquement.");

        const token = localStorage.getItem("token");
        if (token && sessionId) {
          await loadFeedback(token, sessionId);
        }

        return;
      }

      setError(err?.message || "Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!sessionData || isCompleted) return;

    try {
      setCompleting(true);
      setError("");
      setSuccessMessage("");
      setVoiceError("");
      setVoiceSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      await completeSession(token, sessionId);

      const updatedSession = await getSessionById(token, sessionId);

      setSessionData(updatedSession);
      setMessages(updatedSession?.messages || []);
      setRemainingSeconds(calculateRemainingSeconds(updatedSession));
      setSuccessMessage("Session terminée avec succès.");

      if (updatedSession?.feedback) {
        setFeedback(updatedSession.feedback);
      } else {
        await loadFeedback(token, sessionId);
      }
    } catch (err) {
      setError(err?.message || "Impossible de terminer la session");
    } finally {
      setCompleting(false);
    }
  };

  async function handleVoiceSend(file) {
    try {
      setVoiceError("");
      setVoiceSuccess("");
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      if (!sessionData || status !== "active" || remainingSeconds <= 0) {
        throw new Error(
          "Cette session est terminée. Tu ne peux plus envoyer de message vocal."
        );
      }

      const result = await sendVoiceMessage(token, sessionId, file);

      setVoiceTranscription(result.transcription || "");

      setMessages((prev) => [
        ...prev,
        result.user_message,
        result.assistant_message,
      ]);

      setSessionData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          status: result.session_status || prev.status,
          duration_seconds: result.duration_seconds ?? prev.duration_seconds,
          started_at: result.started_at ?? prev.started_at,
          expires_at: result.expires_at ?? prev.expires_at,
          completed_at: result.completed_at ?? prev.completed_at,
          completion_reason:
            result.completion_reason ?? prev.completion_reason,
          remaining_seconds:
            result.remaining_seconds ?? prev.remaining_seconds,
          is_expired: result.is_expired ?? prev.is_expired,
        };
      });

      if (typeof result.remaining_seconds === "number") {
        setRemainingSeconds(result.remaining_seconds);
      }

      if (result.session_status === "completed" || result.is_expired) {
        setRemainingSeconds(0);
        await loadFeedback(token, sessionId);
      }

      setVoiceSuccess("Message vocal envoyé avec succès.");
    } catch (err) {
      if (err?.message === "SESSION_EXPIRED") {
        setSessionData((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                is_expired: true,
                remaining_seconds: 0,
                completion_reason: "timeout",
              }
            : prev
        );

        setRemainingSeconds(0);
        setVoiceError(
          "Temps terminé. La session a été clôturée automatiquement."
        );

        const token = localStorage.getItem("token");
        if (token && sessionId) {
          await loadFeedback(token, sessionId);
        }

        return;
      }

      setVoiceError(err?.message || "Impossible de traiter le message vocal.");
    }
  }

  return (
    <div className="page-root">
      <Navbar />

      <main className="session-shell">
        {loading && (
          <div className="loading-box">
            <p className="loading-title">Chargement...</p>
            <p className="loading-text">
              Nous récupérons la session et les messages.
            </p>
          </div>
        )}

        {error && !loading && <div className="error-box">{error}</div>}

        {successMessage && !loading && (
          <div className="success-box">{successMessage}</div>
        )}

        {voiceSuccess && !loading && (
          <div className="success-box">{voiceSuccess}</div>
        )}

        {!loading && sessionData && (
          <>
            <div className="session-header-card">
              <div className="session-header-top">
                <div className="session-main-info">
                  <h1 className="session-title">
                    {sessionData?.scenario?.title || "Session"}
                  </h1>

                  <div className="session-badges">
                    <span className="category-badge">
                      {sessionData?.scenario?.category || "Sans catégorie"}
                    </span>

                    <span
                      className={`status-pill ${
                        isCompleted ? "completed" : "active"
                      }`}
                    >
                      {isCompleted ? "completed" : "active"}
                    </span>

                    <span
                      className={`timer-pill ${
                        isCompleted
                          ? "finished"
                          : remainingSeconds <= 60
                          ? "danger"
                          : "normal"
                      }`}
                    >
                      {isCompleted
                        ? "Temps terminé"
                        : formatTimer(remainingSeconds)}
                    </span>
                  </div>
                </div>

                <div className="session-actions">
                  <button
                    onClick={() => router.push("/sessions")}
                    className="secondary-btn"
                  >
                    Mes sessions
                  </button>

                  {!isCompleted && (
                    <button
                      onClick={handleCompleteSession}
                      disabled={completing}
                      className="complete-btn"
                    >
                      {completing ? "Finalisation..." : "Terminer la session"}
                    </button>
                  )}
                </div>
              </div>

              <div className="timer-box">
                <div className="timer-top">
                  <div>
                    <p className="timer-title">Temps de simulation</p>
                    <p className="timer-subtitle">
                      Quand le temps arrive à zéro, la session se termine
                      automatiquement.
                    </p>
                  </div>

                  <strong className="timer-value">
                    {isCompleted ? "00:00" : formatTimer(remainingSeconds)}
                  </strong>
                </div>

                <div className="timer-track">
                  <div
                    className={`timer-progress ${
                      isCompleted
                        ? "finished"
                        : remainingSeconds <= 60
                        ? "danger"
                        : "normal"
                    }`}
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="session-chat-card">
              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="empty-box">
                    Aucun message pour le moment. Commence la conversation pour
                    voir apparaître l’échange ici.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isUser = message.role === "user";
                    const confStr = formatSentimentConfidence(
                      message.sentiment_confidence
                    );
                    const showVoiceSentimentBadge =
                      isUser &&
                      (message.sentiment_label ||
                        confStr !== null);

                    return (
                      <div
                        key={message.id}
                        className={`message-row ${
                          isUser ? "user" : "assistant"
                        }`}
                      >
                        <div
                          className={`message-bubble ${
                            isUser ? "user" : "assistant"
                          }`}
                        >
                          <strong>{isUser ? "Vous" : "Assistant"}</strong>
                          {showVoiceSentimentBadge && (
                            <div
                              className={`message-voice-badge ${getSentimentToneClass(
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
                          <div className="message-content">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {isCompleted && (
                <div className="completed-box completed-box-with-action">
                  <span>
                    Cette session est terminée. Les messages texte et vocaux
                    sont désactivés.
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/session/${sessionId}/performance`)
                    }
                    className="performance-btn"
                  >
                    Voir performance détaillée
                  </button>
                </div>
              )}

              {isCompleted && (
                <div className="feedback-card">
                  <div className="feedback-header">
                    <div>
                      <h2 className="feedback-title">
                        Résultat de la simulation
                      </h2>
                      <p className="feedback-subtitle">
                        Évaluation générée automatiquement après la fin de la
                        session.
                      </p>
                    </div>

                    {feedback?.overall_score !== null &&
                      feedback?.overall_score !== undefined && (
                        <div className="overall-score">
                          <span>Score global</span>
                          <strong>
                            {formatScore(feedback.overall_score)}/10
                          </strong>
                        </div>
                      )}
                  </div>

                  {feedbackLoading && (
                    <div className="feedback-loading">
                      Génération du feedback en cours...
                    </div>
                  )}

                  {feedbackError && !feedbackLoading && (
                    <div className="feedback-error">{feedbackError}</div>
                  )}

                  {feedback && !feedbackLoading && (
                    <>
                      <div className="score-grid">
                        <div className="score-item">
                          <span>Communication</span>
                          <strong>
                            {formatScore(feedback.communication_score)}/10
                          </strong>
                        </div>

                        <div className="score-item">
                          <span>Confiance</span>
                          <strong>
                            {formatScore(feedback.confidence_score)}/10
                          </strong>
                        </div>

                        <div className="score-item">
                          <span>Clarté</span>
                          <strong>
                            {formatScore(feedback.clarity_score)}/10
                          </strong>
                        </div>

                        <div className="score-item">
                          <span>Pertinence</span>
                          <strong>
                            {formatScore(feedback.relevance_score)}/10
                          </strong>
                        </div>

                        <div className="score-item">
                          <span>Professionnalisme</span>
                          <strong>
                            {formatScore(feedback.professionalism_score)}/10
                          </strong>
                        </div>
                      </div>

                      <section
                        className="sentiment-model-card"
                        aria-labelledby="session-sentiment-model-title"
                      >
                        <header className="jury-head">
                          <p className="jury-eyebrow">Modèle de sentiment</p>
                          <h2
                            id="session-sentiment-model-title"
                            className="jury-title"
                          >
                            Résultat du modèle de sentiment
                          </h2>
                          <p className="jury-lead">
                            Indicateurs issus de l’analyse vocale et des messages
                            utilisateur annotés par le modèle.
                          </p>
                        </header>
                        <dl className="jury-grid">
                          <div className="jury-row">
                            <dt>Sentiment détecté</dt>
                            <dd>
                              <span
                                className={`sentiment-label-badge ${getSentimentToneClass(
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
                              {formatVoiceSentimentScore(
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
                              {feedback.voice_sentiment_summary ||
                                "Non disponible"}
                            </dd>
                          </div>
                          <div className="jury-row jury-row-span jury-impact">
                            <dt>Impact sur le rating</dt>
                            <dd className="jury-value-multiline">
                              {SENTIMENT_IMPACT_RATING}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <div className="feedback-text-grid">
                        <div className="feedback-text-box">
                          <h3>Points forts</h3>
                          <p>
                            {feedback.strengths ||
                              "Aucun point fort détecté pour le moment."}
                          </p>
                        </div>

                        <div className="feedback-text-box">
                          <h3>Points à améliorer</h3>
                          <p>
                            {feedback.weaknesses ||
                              "Aucun point faible détecté pour le moment."}
                          </p>
                        </div>

                        <div className="feedback-text-box full">
                          <h3>Conseil final</h3>
                          <p>
                            {feedback.final_advice ||
                              "Aucun conseil disponible pour le moment."}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="message-form">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    isCompleted
                      ? "La session est terminée."
                      : "Écrivez votre réponse ici..."
                  }
                  disabled={sending || isCompleted}
                  rows={3}
                  className="message-textarea"
                />

                <button
                  type="submit"
                  disabled={sending || isCompleted || !content.trim()}
                  className="send-button"
                >
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              </form>

              <section className="voice-section">
                <VoiceMessageBox
                  onSend={handleVoiceSend}
                  disabled={sending || isCompleted}
                  transcription={voiceTranscription}
                />

                {voiceError && (
                  <div className="voice-error-box">{voiceError}</div>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      <style jsx>{`
        .page-root {
          min-height: 100vh;
          background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
        }

        .session-shell {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px;
        }

        .loading-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 24px;
        }

        .loading-title {
          margin: 0;
          color: #0f172a;
          font-size: 24px;
          font-weight: 800;
        }

        .loading-text {
          margin: 10px 0 0;
          color: #64748b;
          line-height: 1.7;
        }

        .error-box {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 20px;
          padding: 16px;
          margin-bottom: 20px;
          word-break: break-word;
        }

        .success-box {
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #166534;
          border-radius: 20px;
          padding: 16px;
          margin-bottom: 20px;
          word-break: break-word;
          font-weight: 600;
        }

        .empty-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 8px;
          line-height: 1.7;
        }

        .session-header-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .session-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .session-main-info {
          flex: 1;
          min-width: 0;
        }

        .session-title {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.1;
          word-break: break-word;
        }

        .session-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .category-badge {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-pill,
        .timer-pill {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .status-pill.completed {
          background: #dcfce7;
          color: #166534;
        }

        .status-pill.active {
          background: #fef3c7;
          color: #92400e;
        }

        .timer-pill.normal {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .timer-pill.danger {
          background: #ffedd5;
          color: #c2410c;
        }

        .timer-pill.finished {
          background: #fee2e2;
          color: #991b1b;
        }

        .session-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .secondary-btn,
        .complete-btn,
        .send-button {
          border: none;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .secondary-btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
        }

        .complete-btn {
          background: #16a34a;
          color: #ffffff;
        }

        .complete-btn:disabled,
        .send-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .timer-box {
          margin-top: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 16px;
        }

        .timer-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-bottom: 12px;
        }

        .timer-title {
          margin: 0;
          color: #0f172a;
          font-weight: 800;
        }

        .timer-subtitle {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .timer-value {
          color: #0f172a;
          font-size: 24px;
          white-space: nowrap;
        }

        .timer-track {
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: #e2e8f0;
        }

        .timer-progress {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .timer-progress.normal {
          background: #2563eb;
        }

        .timer-progress.danger {
          background: #f97316;
        }

        .timer-progress.finished {
          background: #ef4444;
        }

        .session-chat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 20px;
        }

        .messages-list {
          display: grid;
          gap: 14px;
          margin-bottom: 20px;
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
          max-width: 75%;
          border-radius: 18px;
          padding: 14px 16px;
          word-break: break-word;
        }

        .message-bubble.user {
          background: #0f172a;
          color: #ffffff;
          border: none;
        }

        .message-bubble.assistant {
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }

        .message-content {
          margin-top: 6px;
          white-space: pre-wrap;
        }

        .completed-box {
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #166534;
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-weight: 600;
        }

        .completed-box-with-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .performance-btn {
          border: none;
          border-radius: 14px;
          background: #0f172a;
          color: #ffffff;
          padding: 10px 16px;
          font-weight: 800;
          cursor: pointer;
        }

        .performance-btn:hover {
          opacity: 0.9;
        }

        .feedback-card {
          background: #ffffff;
          border: 1px solid #dbeafe;
          border-radius: 24px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .feedback-title {
          margin: 0;
          color: #0f172a;
          font-size: 24px;
          font-weight: 800;
        }

        .feedback-subtitle {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .overall-score {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          border-radius: 18px;
          padding: 12px 16px;
          min-width: 140px;
          text-align: center;
        }

        .overall-score span {
          display: block;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .overall-score strong {
          font-size: 24px;
          font-weight: 900;
        }

        .feedback-loading {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          border-radius: 16px;
          padding: 14px 16px;
          font-weight: 600;
        }

        .feedback-error {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 16px;
          padding: 14px 16px;
          font-weight: 600;
        }

        .score-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .score-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
        }

        .score-item span {
          display: block;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .score-item strong {
          color: #0f172a;
          font-size: 22px;
          font-weight: 900;
        }

        .feedback-text-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .feedback-text-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
        }

        .feedback-text-box.full {
          grid-column: 1 / -1;
        }

        .feedback-text-box h3 {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 800;
        }

        .feedback-text-box p {
          margin: 0;
          color: #475569;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .message-form {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .message-textarea {
          flex: 1;
          min-width: 260px;
          resize: vertical;
          border-radius: 16px;
          border: 1px solid #cbd5e1;
          padding: 14px 16px;
          box-sizing: border-box;
          width: 100%;
        }

        .send-button {
          align-self: flex-end;
          background: #2563eb;
          color: #ffffff;
          min-width: 140px;
        }

        .send-button:disabled {
          background: #94a3b8;
        }

        .voice-section {
          margin-top: 24px;
        }

        .voice-error-box {
          margin-top: 12px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 16px;
          padding: 14px 16px;
          word-break: break-word;
        }

        .page-root {
          background:
            radial-gradient(circle at 10% 0%, rgba(37, 99, 235, 0.28), transparent 30%),
            radial-gradient(circle at 90% 8%, rgba(124, 58, 237, 0.2), transparent 28%),
            linear-gradient(180deg, #030712 0%, #0f172a 58%, #eef4ff 100%);
        }

        .session-shell {
          max-width: 1280px;
          padding: 34px 20px 72px;
        }

        .loading-box,
        .session-header-card,
        .session-chat-card,
        .feedback-card,
        .sentiment-model-card {
          border: 1px solid rgba(147, 197, 253, 0.22);
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.52)),
            rgba(255, 255, 255, 0.08);
          box-shadow:
            0 28px 90px rgba(2, 6, 23, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .sentiment-model-card {
          padding: 24px;
          border-radius: 24px;
          margin-bottom: 22px;
        }

        .jury-head {
          margin-bottom: 20px;
        }

        .jury-eyebrow {
          margin: 0 0 8px;
          color: #93c5fd;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .jury-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(20px, 2.4vw, 26px);
          font-weight: 950;
          line-height: 1.2;
        }

        .jury-lead {
          margin: 12px 0 0;
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.7;
          max-width: 820px;
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
          border: 1px solid rgba(147, 197, 253, 0.2);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(96, 165, 250, 0.06)),
            rgba(15, 23, 42, 0.35);
        }

        .jury-row-span {
          grid-template-columns: 1fr;
          align-items: start;
        }

        .jury-row-span dt {
          margin-bottom: 4px;
        }

        .jury-impact {
          border-color: rgba(34, 211, 238, 0.35);
        }

        .jury-row dt {
          margin: 0;
          color: #bfdbfe;
          font-size: 15px;
          font-weight: 800;
        }

        .jury-row dd {
          margin: 0;
          color: #f1f5f9;
          font-size: 16px;
          line-height: 1.65;
        }

        .jury-value-strong {
          font-size: 20px;
          font-weight: 950;
          color: #ffffff;
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
          color: #e0f2fe;
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
          color: #e2e8f0;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.45);
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

        .loading-title,
        .session-title,
        .timer-title,
        .feedback-title,
        .feedback-text-box h3,
        .score-item strong {
          color: #f8fafc;
        }

        .loading-text,
        .timer-subtitle,
        .feedback-subtitle,
        .feedback-text-box p,
        .empty-box {
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.75;
        }

        .category-badge,
        .status-pill,
        .timer-pill {
          font-size: 14px;
          line-height: 1.35;
          padding: 8px 12px;
        }

        .secondary-btn,
        .complete-btn,
        .send-button,
        .performance-btn {
          appearance: none;
          font-family: inherit;
          min-height: 48px;
          font-size: 16px;
          border-radius: 999px;
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.2);
        }

        .secondary-btn:focus-visible,
        .complete-btn:focus-visible,
        .send-button:focus-visible,
        .performance-btn:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .secondary-btn {
          border: 1px solid rgba(147, 197, 253, 0.26);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(96, 165, 250, 0.08));
          color: #ffffff;
        }

        .secondary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: rgba(34, 211, 238, 0.55);
        }

        .complete-btn,
        .send-button {
          background: linear-gradient(135deg, #ffffff 0%, #93c5fd 45%, #22d3ee 100%);
          color: #0f172a;
          border: none;
          font-weight: 900;
        }

        .complete-btn:hover:not(:disabled),
        .send-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 48px rgba(37, 99, 235, 0.35);
        }

        .performance-btn {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: #f8fafc;
          border: 1px solid rgba(147, 197, 253, 0.35);
        }

        .performance-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(34, 211, 238, 0.65);
        }

        .overall-score {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(96, 165, 250, 0.08));
          border: 1px solid rgba(147, 197, 253, 0.28);
          color: #e0f2fe;
        }

        .overall-score span {
          color: #bfdbfe;
          font-size: 13px;
        }

        .overall-score strong {
          color: #ffffff;
          font-size: 28px;
        }

        .timer-box,
        .score-item,
        .feedback-text-box {
          border: 1px solid rgba(147, 197, 253, 0.18);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(96, 165, 250, 0.06)),
            rgba(15, 23, 42, 0.24);
        }

        .timer-value {
          color: #ffffff;
          font-size: 30px;
        }

        .messages-list {
          gap: 18px;
        }

        .message-bubble {
          max-width: min(78%, 820px);
          padding: 16px 18px;
          font-size: 16px;
          line-height: 1.75;
        }

        .message-bubble.user {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }

        .message-bubble.assistant {
          border-color: rgba(147, 197, 253, 0.22);
          background: rgba(255, 255, 255, 0.95);
          color: #0f172a;
        }

        .message-bubble strong {
          font-size: 15px;
        }

        .message-content {
          font-size: 16px;
          line-height: 1.75;
        }

        .message-textarea {
          min-height: 118px;
          border-color: rgba(147, 197, 253, 0.32);
          background: rgba(255, 255, 255, 0.96);
          color: #0f172a;
          font-size: 16px;
          line-height: 1.65;
        }

        .voice-section {
          border-top: 1px solid rgba(147, 197, 253, 0.18);
          padding-top: 22px;
        }

        @media (max-width: 900px) {
          .session-shell {
            padding: 24px 16px;
          }

          .session-header-top {
            flex-direction: column;
            align-items: stretch;
          }

          .session-actions {
            width: 100%;
          }

          .message-bubble {
            max-width: 88%;
          }
        }

        @media (max-width: 640px) {
          .session-shell {
            padding: 18px 12px;
          }

          .session-header-card,
          .session-chat-card {
            padding: 16px;
            border-radius: 22px;
          }

          .session-title {
            font-size: 30px;
          }

          .timer-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .message-form {
            flex-direction: column;
            align-items: stretch;
          }

          .message-textarea {
            min-width: 0;
          }

          .send-button,
          .secondary-btn,
          .complete-btn,
          .performance-btn {
            width: 100%;
          }

          .message-bubble {
            max-width: 100%;
          }

          .feedback-text-grid {
            grid-template-columns: 1fr;
          }

          .overall-score {
            width: 100%;
          }

          .jury-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
