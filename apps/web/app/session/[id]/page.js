"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import PageHeader from "../../components/ui/PageHeader";
import { getScenarioById, sendSessionMessage } from "../../lib/api";

const fallbackScenarioMap = {
  "job-interview": {
    title: "Entretien d'embauche",
    subtitle: "Simulation de recrutement",
    intro:
      "Bonjour. Je suis votre recruteur aujourd’hui. Présentez-vous brièvement et expliquez pourquoi vous êtes un bon candidat.",
  },
  "investor-pitch": {
    title: "Pitch investisseur",
    subtitle: "Simulation de présentation",
    intro:
      "Bonjour. Vous avez 60 secondes pour me convaincre que votre projet mérite un investissement. Je vous écoute.",
  },
  negotiation: {
    title: "Négociation",
    subtitle: "Simulation de discussion stratégique",
    intro:
      "Nous avons une proposition à discuter. Défendez votre position et essayez d’obtenir un meilleur accord.",
  },
  leadership: {
    title: "Leadership & prise de parole",
    subtitle: "Simulation de communication d’impact",
    intro:
      "Vous êtes devant une équipe. Donnez une prise de parole claire, structurée et motivante.",
  },
};

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const scenarioId = params?.id;

  const [isMobile, setIsMobile] = useState(false);
  const [scenarioData, setScenarioData] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
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
    async function loadScenario() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setSessionError("Aucun token trouvé. Merci de vous reconnecter.");
          setLoadingScenario(false);
          return;
        }

        const data = await getScenarioById(token, scenarioId);

        const normalizedScenario = {
          title:
            data?.title ||
            data?.name ||
            fallbackScenarioMap[scenarioId]?.title ||
            "Session",
          subtitle:
            data?.subtitle ||
            data?.category ||
            fallbackScenarioMap[scenarioId]?.subtitle ||
            "Simulation",
          intro:
            data?.intro ||
            data?.opening_message ||
            data?.first_message ||
            fallbackScenarioMap[scenarioId]?.intro ||
            "Bienvenue dans cette session. Commencez votre réponse.",
        };

        setScenarioData(normalizedScenario);
        setMessages([
          {
            role: "assistant",
            content: normalizedScenario.intro,
          },
        ]);
      } catch (err) {
        const fallback = fallbackScenarioMap[scenarioId];

        if (fallback) {
          setScenarioData(fallback);
          setMessages([
            {
              role: "assistant",
              content: fallback.intro,
            },
          ]);
          setSessionError(
            "Le scénario backend n’a pas pu être chargé. Le mode local a été utilisé."
          );
        } else {
          setSessionError(err.message || "Impossible de charger cette session.");
        }
      } finally {
        setLoadingScenario(false);
      }
    }

    if (scenarioId) {
      loadScenario();
    }
  }, [scenarioId]);

  const scenario = useMemo(() => {
    return (
      scenarioData || {
        title: "Session",
        subtitle: "Simulation",
        intro:
          "Bienvenue dans cette session. Commencez votre réponse et entraînez-vous comme dans une vraie situation.",
      }
    );
  }, [scenarioData]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/auth/login");
  }

  async function handleSend() {
    if (!input.trim() || isSending) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setSessionError("Session expirée. Merci de vous reconnecter.");
      router.push("/auth/login");
      return;
    }

    const trimmedInput = input.trim();

    const userMessage = {
      role: "user",
      content: trimmedInput,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);
    setSessionError("");

    try {
      const historyPayload = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const data = await sendSessionMessage(
        token,
        scenarioId,
        trimmedInput,
        historyPayload
      );

      const assistantReply =
        data?.reply ||
        data?.message ||
        data?.assistant_message ||
        data?.response ||
        "Aucune réponse reçue du backend.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantReply,
        },
      ]);
    } catch (err) {
      setSessionError(err.message || "Erreur lors de l’envoi du message.");
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

  if (loadingScenario) {
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

  if (!scenarioData && sessionError) {
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
          badge={scenario.subtitle}
          title={scenario.title}
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
                <strong>ID scénario :</strong>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#475569",
                    wordBreak: "break-word",
                  }}
                >
                  {scenarioId}
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
                <strong>Mode :</strong>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  Session connectée au backend
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
                    key={index}
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
