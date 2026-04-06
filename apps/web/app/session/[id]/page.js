"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
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

      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      await completeSession(token, sessionId);
      const updatedSession = await getSessionById(token, sessionId);

      setSessionData(updatedSession);
      setMessages(updatedSession?.messages || []);
    } catch (err) {
      setError(err.message || "Impossible de terminer la session");
    } finally {
      setCompleting(false);
    }
  };

  const status = sessionData?.status || "unknown";
  const isCompleted = status === "completed";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
      }}
    >
      <Navbar />

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        {loading && <p>Chargement...</p>}

        {error && !loading && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "20px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && sessionData && (
          <>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "28px",
                padding: "24px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h1 style={{ marginBottom: "10px" }}>
                    {sessionData?.scenario?.title || "Session"}
                  </h1>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {sessionData?.scenario?.category || "Sans catégorie"}
                    </span>

                    <span
                      style={{
                        background: isCompleted ? "#dcfce7" : "#fef3c7",
                        color: isCompleted ? "#166534" : "#92400e",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    >
                      {isCompleted ? "completed" : "active"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => router.push("/sessions")}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      padding: "12px 18px",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Mes sessions
                  </button>

                  {!isCompleted && (
                    <button
                      onClick={handleCompleteSession}
                      disabled={completing}
                      style={{
                        border: "none",
                        borderRadius: "14px",
                        padding: "12px 18px",
                        background: "#16a34a",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: completing ? "not-allowed" : "pointer",
                        opacity: completing ? 0.7 : 1,
                      }}
                    >
                      {completing ? "Finalisation..." : "Terminer la session"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "28px",
                padding: "20px",
              }}
            >
              <div style={{ display: "grid", gap: "14px", marginBottom: "20px" }}>
                {messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      style={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "75%",
                          background: isUser ? "#0f172a" : "#f8fafc",
                          color: isUser ? "#ffffff" : "#0f172a",
                          border: isUser ? "none" : "1px solid #e2e8f0",
                          borderRadius: "18px",
                          padding: "14px 16px",
                        }}
                      >
                        <strong>{isUser ? "Vous" : "Assistant"}</strong>
                        <div style={{ marginTop: "6px" }}>{message.content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isCompleted && (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    marginBottom: "16px",
                    fontWeight: 600,
                  }}
                >
                  Cette session est terminée.
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
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
                  style={{
                    flex: 1,
                    minWidth: "260px",
                    resize: "vertical",
                    borderRadius: "16px",
                    border: "1px solid #cbd5e1",
                    padding: "14px 16px",
                  }}
                />

                <button
                  type="submit"
                  disabled={sending || isCompleted || !content.trim()}
                  style={{
                    alignSelf: "flex-end",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px 20px",
                    background:
                      sending || isCompleted || !content.trim()
                        ? "#94a3b8"
                        : "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor:
                      sending || isCompleted || !content.trim()
                        ? "not-allowed"
                        : "pointer",
                    minWidth: "140px",
                  }}
                >
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}