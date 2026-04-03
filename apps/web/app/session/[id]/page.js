"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import PageHeader from "../../components/ui/PageHeader";
import { getSessionById, sendSessionMessage } from "../../lib/api";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id;

  const [isMobile, setIsMobile] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    async function loadSession() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        const data = await getSessionById(token, sessionId);
        setSessionData(data);

        const existingMessages = Array.isArray(data?.messages) ? data.messages : [];

        if (existingMessages.length > 0) {
          setMessages(existingMessages);
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                "Bienvenue dans cette session. Commencez votre réponse pour démarrer la simulation.",
            },
          ]);
        }
      } catch (err) {
        const message =
          err.message || "Impossible de charger cette session.";

        if (
          message.toLowerCase().includes("401") ||
          message.toLowerCase().includes("403") ||
          message.toLowerCase().includes("token")
        ) {
          localStorage.removeItem("token");
          router.replace("/auth/login");
          return;
        }

        setSessionError(message);
      } finally {
        setLoadingSession(false);
      }
    }

    if (sessionId) {
      loadSession();
    }
  }, [sessionId, router]);

  const sessionTitle = useMemo(() => {
    return sessionData?.scenario?.title || "Session";
  }, [sessionData]);

  const sessionSubtitle = useMemo(() => {
    return sessionData?.scenario?.category || "Simulation";
  }, [sessionData]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.replace("/auth/login");
  }

  async function handleSend() {
    if (!input.trim() || isSending) return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const trimmedInput = input.trim();

    const userMessage = {
      role: "user",
      content: trimmedInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setSessionError("");

    try {
      const data = await sendSessionMessage(token, sessionId, trimmedInput);

      const assistantReply =
        data?.content || "Aucune réponse reçue du backend.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantReply,
        },
      ]);
    } catch (err) {
      const message =
        err.message || "Erreur lors de l’envoi du message.";

      if (
        message.toLowerCase().includes("401") ||
        message.toLowerCase().includes("403") ||
        message.toLowerCase().includes("token")
      ) {
        localStorage.removeItem("token");
        router.replace("/auth/login");
        return;
      }

      setSessionError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Une erreur est survenue pendant la communication avec le backend.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loadingSession) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <main
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: isMobile ? "20px 14px" : "32px 20px",
          }}
        >
          Chargement de la session...
        </main>
      </div>
    );
  }

  if (!sessionData && sessionError) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <main
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: isMobile ? "20px 14px" : "32px 20px",
          }}
        >
          <Card
            style={{
              border: "1px solid #fecaca",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            }}
          >
            <h1
              style={{
                color: "#b91c1c",
                marginTop: 0,
                fontSize: isMobile ? "24px" : "32px",
              }}
            >
              Erreur session
            </h1>

            <p style={{ color: "#334155", lineHeight: 1.6 }}>{sessionError}</p>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <Button onClick={() => router.push("/scenarios")} fullWidth={isMobile}>
                Retour aux scénarios
              </Button>

              <Button variant="danger" onClick={handleLogout} fullWidth={isMobile}>
                Déconnexion
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: isMobile ? "20px 14px" : "32px 20px",
        }}
      >
        <PageHeader
          dark
          badge={sessionSubtitle}
          title={sessionTitle}
          description="Entraîne-toi avec une vraie session connectée au backend."
        />

        {sessionError && (
          <Alert type="warning" style={{ marginBottom: "18px" }}>
            {sessionError}
          </Alert>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "300px 1fr",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <Card
            style={{
              borderRadius: "22px",
              padding: isMobile ? "18px" : "22px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#0f172a",
                fontSize: isMobile ? "20px" : "22px",
              }}
            >
              Session
            </h2>

            <div style={{ display: "grid", gap: "12px" }}>
              <Card
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  boxShadow: "none",
                }}
              >
                <strong>ID session :</strong>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#475569",
                    wordBreak: "break-word",
                  }}
                >
                  {sessionId}
                </p>
              </Card>

              <Card
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  boxShadow: "none",
                }}
              >
                <strong>Statut :</strong>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  {sessionData?.status || "active"}
                </p>
              </Card>
            </div>

            <div
              style={{
                display: "grid",
                gap: "10px",
                marginTop: "18px",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr",
              }}
            >
              <Button onClick={() => router.push("/scenarios")} fullWidth>
                Retour
              </Button>

              <Button variant="danger" onClick={handleLogout} fullWidth>
                Déconnexion
              </Button>
            </div>
          </Card>

          <Card
            style={{
              borderRadius: "22px",
              padding: 0,
              overflow: "hidden",
              minHeight: isMobile ? "540px" : "620px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #e2e8f0",
                fontWeight: "800",
                color: "#0f172a",
                fontSize: isMobile ? "16px" : "18px",
              }}
            >
              Conversation
            </div>

            <div
              style={{
                flex: 1,
                padding: isMobile ? "14px" : "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                background: "#f8fafc",
                overflowY: "auto",
              }}
            >
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id || index}
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: isMobile ? "92%" : "78%",
                        padding: isMobile ? "12px 14px" : "14px 16px",
                        borderRadius: "18px",
                        background: isUser ? "#0f172a" : "#ffffff",
                        color: isUser ? "#ffffff" : "#1e293b",
                        border: isUser ? "none" : "1px solid #e2e8f0",
                        boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        fontSize: isMobile ? "14px" : "15px",
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      maxWidth: isMobile ? "92%" : "78%",
                      padding: isMobile ? "12px 14px" : "14px 16px",
                      borderRadius: "18px",
                      background: "#ffffff",
                      color: "#64748b",
                      border: "1px solid #e2e8f0",
                      fontSize: isMobile ? "14px" : "15px",
                    }}
                  >
                    L’assistant prépare une réponse...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                padding: isMobile ? "12px" : "16px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "12px",
                alignItems: "stretch",
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tape ta réponse ici..."
                rows={isMobile ? 4 : 3}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "15px",
                  background: "#f8fafc",
                  width: "100%",
                }}
              />

              <Button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                fullWidth={isMobile}
                variant="blue"
                style={{
                  minWidth: isMobile ? "100%" : "120px",
                }}
              >
                Envoyer
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}