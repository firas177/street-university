"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { getScenarios, startSession } from "../lib/api";

function getDifficultyLabel(value) {
  if (value === 1) return "Facile";
  if (value === 2) return "Moyen";
  if (value === 3) return "Difficile";
  return "Standard";
}

function getDifficultyVariant(value) {
  if (value === 1) return "completed";
  if (value === 2) return "info";
  return "active";
}

export default function ScenariosPage() {
  const router = useRouter();

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState("");

  useEffect(() => {
    async function loadScenarios() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        setLoading(true);
        setError("");

        const data = await getScenarios(token);
        setScenarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Scenarios loading error:", err);
        setError(err?.message || "Impossible de charger les scénarios.");
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, [router]);

  async function handleStartScenario(scenarioId) {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    try {
      setStartingId(scenarioId);
      setError("");

      const session = await startSession(token, scenarioId);

      if (!session?.id) {
        throw new Error("Session non créée correctement.");
      }

      router.push(`/session/${session.id}`);
    } catch (err) {
      console.error("Start session error:", err);
      setError(err?.message || "Impossible de démarrer cette simulation.");
    } finally {
      setStartingId("");
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main
          style={{
            minHeight: "100vh",
            background:
              "linear-gradient(180deg, #f8fbff 0%, #eef4ff 38%, #ffffff 100%)",
            padding: "32px 20px 60px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <Card style={{ padding: "28px", borderRadius: "28px" }}>
              <h1
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "28px",
                  fontWeight: "800",
                }}
              >
                Chargement des scénarios...
              </h1>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #f8fbff 0%, #eef4ff 38%, #ffffff 100%)",
          padding: "32px 20px 60px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {error && (
            <Alert
              type="error"
              message={error}
              style={{ borderRadius: "20px" }}
            />
          )}

          <section>
            <SectionHeader
              eyebrow="Scénarios"
              title="Choisis une simulation"
              description="Sélectionne un scénario pour commencer."
            />

            {scenarios.length === 0 ? (
              <Card
                style={{
                  padding: "24px",
                  borderRadius: "28px",
                }}
              >
                <Alert
                  type="info"
                  message="Aucun scénario trouvé pour le moment."
                />
              </Card>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                  gap: "18px",
                }}
              >
                {scenarios.map((scenario) => (
                  <Card
                    key={scenario.id}
                    hoverable
                    style={{
                      padding: "0",
                      borderRadius: "28px",
                      overflow: "hidden",
                      minHeight: "300px",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 16px 35px rgba(15,23,42,0.06)",
                    }}
                  >
                    <div
                      style={{
                        padding: "18px 20px",
                        background:
                          "linear-gradient(135deg, #eff6ff, #f8fbff)",
                        borderBottom: "1px solid #dbeafe",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Badge variant="info">
                        {scenario.category || "Général"}
                      </Badge>

                      <Badge variant={getDifficultyVariant(scenario.difficulty)}>
                        {getDifficultyLabel(scenario.difficulty)}
                      </Badge>
                    </div>

                    <div
                      style={{
                        padding: "22px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "18px",
                        flex: 1,
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            color: "#0f172a",
                            fontSize: "22px",
                            fontWeight: "800",
                            lineHeight: 1.2,
                          }}
                        >
                          {scenario.title || "Scénario sans titre"}
                        </h2>

                        <p
                          style={{
                            margin: "12px 0 0",
                            color: "#475569",
                            fontSize: "14px",
                            lineHeight: 1.75,
                          }}
                        >
                          {scenario.description ||
                            "Aucune description disponible pour ce scénario."}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleStartScenario(scenario.id)}
                        disabled={startingId === scenario.id}
                      >
                        {startingId === scenario.id
                          ? "Démarrage..."
                          : "Démarrer la simulation"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}