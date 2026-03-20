"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { getScenarios } from "../lib/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import PageHeader from "../components/ui/PageHeader";

const mockScenarios = [
  {
    id: "job-interview",
    title: "Entretien d'embauche",
    description:
      "Simule un entretien professionnel pour améliorer tes réponses, ta clarté et ta confiance.",
    category: "Interview",
  },
  {
    id: "investor-pitch",
    title: "Pitch investisseur",
    description:
      "Présente une idée de projet face à un investisseur virtuel et entraîne ta persuasion.",
    category: "Pitch",
  },
  {
    id: "negotiation",
    title: "Négociation",
    description:
      "Travaille ton argumentation, ta gestion de pression et ta capacité à défendre ta position.",
    category: "Negotiation",
  },
  {
    id: "leadership",
    title: "Leadership & prise de parole",
    description:
      "Entraîne-toi à parler avec impact, structure et présence dans un contexte de leadership.",
    category: "Leadership",
  },
];

export default function ScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingMockData, setUsingMockData] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
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
          setError("Aucun token trouvé. Merci de vous reconnecter.");
          setLoading(false);
          return;
        }

        const data = await getScenarios(token);

        if (Array.isArray(data)) {
          setScenarios(data);
        } else if (Array.isArray(data.scenarios)) {
          setScenarios(data.scenarios);
        } else {
          setScenarios([]);
        }
      } catch (err) {
        console.error("ERREUR SCENARIOS:", err);
        setScenarios(mockScenarios);
        setUsingMockData(true);
        setError("");
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/auth/login");
  }

  function handleStartScenario(scenarioId) {
    router.push(`/session/${scenarioId}`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ padding: isMobile ? "24px 14px" : "40px", fontSize: "18px" }}>
          Chargement des scénarios...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <main
          style={{
            maxWidth: "1000px",
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
              Erreur scénarios
            </h1>

            <p style={{ color: "#334155", lineHeight: 1.6 }}>{error}</p>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <Button
                onClick={() => router.push("/dashboard")}
                fullWidth={isMobile}
              >
                Retour au dashboard
              </Button>

              <Button
                variant="danger"
                onClick={handleLogout}
                fullWidth={isMobile}
              >
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
          badge="Street University"
          title="Scénarios disponibles"
          description="Choisis un scénario pour lancer une simulation et commencer ton entraînement."
        />

        {usingMockData && (
          <Alert type="warning" style={{ marginBottom: "18px" }}>
            Mode démo activé : les scénarios affichés sont temporaires en attendant le backend.
          </Alert>
        )}

        {scenarios.length === 0 ? (
          <Card
            style={{
              borderRadius: isMobile ? "18px" : "24px",
              padding: isMobile ? "20px" : "32px",
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#0f172a",
                fontSize: isMobile ? "22px" : "28px",
              }}
            >
              Aucun scénario trouvé
            </h2>
            <p style={{ color: "#64748b", lineHeight: 1.6 }}>
              Aucun scénario n’est disponible pour le moment.
            </p>
          </Card>
        ) : (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {scenarios.map((scenario, index) => (
              <Card
                key={scenario.id || index}
                style={{
                  borderRadius: isMobile ? "18px" : "22px",
                  padding: isMobile ? "18px" : "24px",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    color: "#0f172a",
                    fontSize: isMobile ? "20px" : "22px",
                    lineHeight: 1.3,
                  }}
                >
                  {scenario.title || scenario.name || `Scénario ${index + 1}`}
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    lineHeight: 1.6,
                    minHeight: isMobile ? "auto" : "72px",
                    fontSize: isMobile ? "14px" : "15px",
                  }}
                >
                  {scenario.description || "Aucune description disponible."}
                </p>

                {scenario.category && (
                  <div
                    style={{
                      display: "inline-block",
                      marginBottom: "14px",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "13px",
                      fontWeight: "700",
                    }}
                  >
                    {scenario.category}
                  </div>
                )}

                <div style={{ marginTop: "14px" }}>
                  <Button
                    onClick={() => handleStartScenario(scenario.id)}
                    fullWidth={isMobile}
                  >
                    Commencer
                  </Button>
                </div>
              </Card>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}