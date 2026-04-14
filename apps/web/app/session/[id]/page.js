"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import VoiceMessageBox from "../../components/ui/VoiceMessageBox";
import {
  getSessionById,
  sendSessionMessage,
  completeSession,
} from "../../lib/api";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id;

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
        setSessionData(data);
        setMessages(data?.messages || []);
      } catch (err) {
        setError(err.message || "Erreur lors du chargement de la session");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [router, sessionId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;
    if (!sessionData || sessionData.status === "completed") return;

    try {
      setSending(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const userMessage = {
        id: `temp-user-${Date.now()}`,
        session_id: sessionId,
        role: "user",
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      const currentContent = content.trim();
      setContent("");

      const assistantMessage = await sendSessionMessage(
        token,
        sessionId,
        currentContent
      );

      setMessages((prev) => [...prev, assistantMessage]);
      setSuccessMessage("Message envoyé avec succès.");
    } catch (err) {
      setError(err.message || "Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!sessionData || sessionData.status === "completed") return;

    try {
      setCompleting(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      await completeSession(token, sessionId);
      const updatedSession = await getSessionById(token, sessionId);

      setSessionData(updatedSession);
      setMessages(updatedSession?.messages || []);
      setSuccessMessage("Session terminée avec succès.");
    } catch (err) {
      setError(err.message || "Impossible de terminer la session");
    } finally {
      setCompleting(false);
    }
  };

  async function handleVoiceSend(file) {
    try {
      setVoiceError("");
      setVoiceSuccess("");

      const fakeTranscription = `Transcription simulée reçue pour : ${file.name}`;
      setVoiceTranscription(fakeTranscription);
      setVoiceSuccess("Message vocal reçu avec succès.");
    } catch (err) {
      setVoiceError(
        err?.message || "Impossible de traiter le message vocal."
      );
    }
  }

  const status = sessionData?.status || "unknown";
  const isCompleted = status === "completed";

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
                          <div className="message-content">{message.content}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {isCompleted && (
                <div className="completed-box">
                  Cette session est terminée.
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

                {voiceError && <div className="voice-error-box">{voiceError}</div>}
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

        .status-pill {
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

          .message-form {
            flex-direction: column;
            align-items: stretch;
          }

          .message-textarea {
            min-width: 0;
          }

          .send-button,
          .secondary-btn,
          .complete-btn {
            width: 100%;
          }

          .message-bubble {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}