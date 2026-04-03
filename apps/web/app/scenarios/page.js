"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import PageHeader from "../components/ui/PageHeader";
import { getScenarios, startSession } from "../lib/api";

export default function ScenariosPage() {
  const router = useRouter();

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        const data = await getScenarios(token);
        setScenarios(Array.isArray(data) ? data : []);
      } catch (err) {
        const message =
          err.message || "Impossible de charger les scénarios.";

        if (
          message.toLowerCase().includes("401") ||
          message.toLowerCase().includes("403") ||
          message.toLowerCase().includes("token")
        ) {
          localStorage.removeItem("token");
          router.replace("/auth/login");
          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.replace("/auth/login");
  }

  async function handleStartScenario(scenarioId) {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setStartingId(scenarioId);
      setError("");

      const session = await startSession(token, scenarioId);

      if (!session?.id) {
        throw new Error("Session créée mais identifiant introuvable.");
      }

      router.push(`/session/${session.id}`);
    } catch (err) {
      const message =
        err.message || "Impossible de démarrer la session.";

      if (
        message.toLowerCase().includes("401") ||
        message.toLowerCase().includes("403") ||
        message.toLowerCase().includes("token")
      ) {
        localStorage.removeItem("token");
        router.replace("/auth/login");
        return;
      }

      setError(message);
    } finally {
      setStartingId(null);
    }
  }

  if (loading) {
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
          Chargement des scénarios...
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
          badge="Scénarios"
          title="Choisis une simulation"
          description="Sélectionne un scénario pour démarrer une vraie session connectée au backend."
        />

        {error && (
          <Alert type="warning" style={{ marginBottom: "18px" }}>
            {error}
          </Alert>
        )}

        {!scenarios.length ? (
          <Card
            style={{
              borderRadius: "22px",
              padding: isMobile ? "18px" : "24px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#0f172a",
                fontSize: isMobile ? "20px" : "24px",
              }}
            >
              Aucun scénario trouvé
            </h2>

            <p style={{ color: "#475569", lineHeight: 1.6 }}>
              Aucun scénario n’est disponible pour le moment. Vérifie que des
              scénarios existent bien dans la base de données.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexDirection: isMobile ? "column" : "row",
                marginTop: "18px",
              }}
            >
              <Button onClick={() => window.location.reload()} fullWidth={isMobile}>
                Réessayer
              </Button>

              <Button variant="danger" onClick={handleLogout} fullWidth={isMobile}>
                Déconnexion
              </Button>
            </div>
          </Card>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "18px",
            }}
          >
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                style={{
                  borderRadius: "22px",
                  padding: isMobile ? "18px" : "22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "260px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      background: "#e0f2fe",
                      color: "#0c4a6e",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "14px",
                    }}
                  >
                    {scenario.category || "Simulation"}
                  </div>

                  <h2
                    style={{
                      margin: "0 0 10px",
                      color: "#0f172a",
                      fontSize: isMobile ? "22px" : "24px",
                      lineHeight: 1.2,
                    }}
                  >
                    {scenario.title}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#475569",
                      lineHeight: 1.7,
                      fontSize: isMobile ? "14px" : "15px",
                    }}
                  >
                    {scenario.description || "Aucune description disponible."}
                  </p>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      marginBottom: "14px",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    Difficulté : <strong>{scenario.difficulty ?? 1}</strong>
                  </div>

                  <Button
                    onClick={() => handleStartScenario(scenario.id)}
                    disabled={startingId === scenario.id}
                    fullWidth
                    variant="blue"
                  >
                    {startingId === scenario.id
                      ? "Démarrage..."
                      : "Commencer la session"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}