"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Alert from "../components/ui/Alert";
import { getScenarios, startSession } from "../lib/api";

const DURATION_OPTIONS = [
  { label: "1 min", value: 60 },
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
];

function getDifficultyLabel(value) {
  if (value === 1) return "Facile";
  if (value === 2) return "Moyen";
  if (value === 3) return "Difficile";
  return "Standard";
}

function getDifficultyClass(value) {
  if (value === 1) return "easy";
  if (value === 2) return "medium";
  if (value === 3) return "hard";
  return "standard";
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

export default function ScenariosPage() {
  const router = useRouter();

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(60);

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

      const session = await startSession(token, scenarioId, selectedDuration);

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

  return (
    <>
      <Navbar />

      <main className="premium-page">
        <div className="page-container">
          {error && (
            <Alert type="error" style={{ marginBottom: "18px" }}>
              {error}
            </Alert>
          )}

          <section className="hero">
            <div>
              <p className="eyebrow">Scénarios Street University</p>
              <h1>Choisis une simulation réaliste</h1>
              <p>
                Entraîne-toi dans des situations professionnelles concrètes avec
                un agent IA, un temps limité et un feedback exploitable.
              </p>

              <div className="duration-selector">
                <p className="duration-title">Choisir la durée</p>

                <div className="duration-options">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedDuration(option.value)}
                      className={
                        selectedDuration === option.value
                          ? "duration-button active"
                          : "duration-button"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hero-panel">
              <span>Durée sélectionnée</span>
              <strong>{formatDuration(selectedDuration)}</strong>
              <p>Session chronométrée avec analyse finale.</p>
            </div>
          </section>

          {loading ? (
            <section className="state-card">
              <p className="eyebrow">Chargement</p>
              <h2>Préparation des scénarios...</h2>
              <p>Nous récupérons les simulations disponibles.</p>
            </section>
          ) : scenarios.length === 0 ? (
            <section className="state-card">
              <p className="eyebrow">Catalogue</p>
              <h2>Aucun scénario disponible</h2>
              <p>Aucun scénario trouvé pour le moment.</p>
            </section>
          ) : (
            <section className="scenario-grid">
              {scenarios.map((scenario, index) => {
                const difficultyClass = getDifficultyClass(
                  scenario.difficulty
                );

                return (
                  <article className="scenario-card" key={scenario.id}>
                    <div className="card-index">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="card-top">
                      <span className="category-badge">
                        {scenario.category || "Général"}
                      </span>

                      <span className={`difficulty-badge ${difficultyClass}`}>
                        {getDifficultyLabel(scenario.difficulty)}
                      </span>
                    </div>

                    <h2>{scenario.title || "Scénario sans titre"}</h2>

                    <p>
                      {scenario.description ||
                        "Aucune description disponible pour ce scénario."}
                    </p>

                    <div className="card-footer">
                      <span>
                        Temps limité : {formatDuration(selectedDuration)}
                      </span>

                      <button
                        onClick={() => handleStartScenario(scenario.id)}
                        disabled={startingId === scenario.id}
                      >
                        {startingId === scenario.id
                          ? "Démarrage..."
                          : "Démarrer"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <style jsx>{`
        .premium-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 0%, rgba(37, 99, 235, 0.32), transparent 28%),
            radial-gradient(circle at 90% 10%, rgba(124, 58, 237, 0.26), transparent 28%),
            linear-gradient(180deg, #030712 0%, #0f172a 54%, #eef4ff 100%);
          padding: 34px 20px 76px;
          color: #f8fafc;
        }

        .page-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 24px;
          align-items: stretch;
          border: 1px solid rgba(147, 197, 253, 0.24);
          border-radius: 32px;
          padding: 34px;
          background:
            radial-gradient(circle at 22% 12%, rgba(37, 99, 235, 0.38), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.62));
          box-shadow: 0 34px 100px rgba(2, 6, 23, 0.32);
          backdrop-filter: blur(20px);
          margin-bottom: 22px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #93c5fd;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(42px, 6vw, 72px);
          line-height: 0.98;
          font-weight: 950;
        }

        .hero p,
        .state-card p,
        .scenario-card p {
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.75;
        }

        .duration-selector {
          margin-top: 28px;
          padding: 18px;
          border: 1px solid rgba(147, 197, 253, 0.2);
          border-radius: 24px;
          background: rgba(15, 23, 42, 0.42);
        }

        .duration-title {
          margin: 0 0 12px;
          color: #bfdbfe;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .duration-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .duration-button {
          appearance: none;
          border: 1px solid rgba(147, 197, 253, 0.24);
          border-radius: 999px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.08);
          color: #dbeafe;
          font-family: inherit;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.2s ease, color 0.2s ease;
        }

        .duration-button:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.16);
        }

        .duration-button.active {
          background: linear-gradient(135deg, #ffffff, #93c5fd 54%, #22d3ee);
          color: #0f172a;
          border-color: transparent;
          box-shadow: 0 14px 34px rgba(37, 99, 235, 0.26);
        }

        .hero-panel,
        .state-card,
        .scenario-card {
          border: 1px solid rgba(147, 197, 253, 0.22);
          border-radius: 28px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.76), rgba(30, 41, 59, 0.48)),
            rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.26);
          backdrop-filter: blur(18px);
        }

        .hero-panel {
          padding: 24px;
        }

        .hero-panel span,
        .card-footer span {
          color: #bfdbfe;
          font-size: 15px;
          font-weight: 800;
        }

        .hero-panel strong {
          display: block;
          margin-top: 10px;
          color: #ffffff;
          font-size: 54px;
          line-height: 1;
          font-weight: 950;
        }

        .state-card {
          padding: 30px;
        }

        .state-card h2 {
          margin: 0;
          color: #ffffff;
          font-size: 32px;
          font-weight: 950;
        }

        .scenario-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
          gap: 18px;
        }

        .scenario-card {
          position: relative;
          overflow: hidden;
          min-height: 360px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }

        .scenario-card:hover {
          transform: translateY(-5px);
          border-color: rgba(34, 211, 238, 0.68);
          box-shadow: 0 34px 110px rgba(37, 99, 235, 0.22);
        }

        .card-index {
          position: absolute;
          right: 22px;
          bottom: 18px;
          color: rgba(191, 219, 254, 0.12);
          font-size: 86px;
          line-height: 1;
          font-weight: 950;
        }

        .card-top {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .category-badge,
        .difficulty-badge {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 900;
        }

        .category-badge {
          background: rgba(96, 165, 250, 0.16);
          color: #dbeafe;
          border: 1px solid rgba(147, 197, 253, 0.32);
        }

        .difficulty-badge.easy {
          background: #dcfce7;
          color: #166534;
        }

        .difficulty-badge.medium {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .difficulty-badge.hard {
          background: #fef3c7;
          color: #92400e;
        }

        .difficulty-badge.standard {
          background: #ede9fe;
          color: #5b21b6;
        }

        .scenario-card h2 {
          margin: 0;
          color: #ffffff;
          font-size: 25px;
          line-height: 1.18;
          font-weight: 950;
        }

        .scenario-card p {
          margin: 14px 0 0;
          color: #c7d2fe;
        }

        .card-footer {
          position: relative;
          z-index: 1;
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding-top: 24px;
        }

        .card-footer button {
          appearance: none;
          font-family: inherit;
          min-height: 50px;
          border: 0;
          border-radius: 999px;
          padding: 14px 22px;
          background: linear-gradient(135deg, #ffffff, #93c5fd 54%, #22d3ee);
          color: #0f172a;
          font-size: 16px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 18px 44px rgba(37, 99, 235, 0.28);
          transition: transform 0.18s ease, box-shadow 0.22s ease, filter 0.2s ease;
        }

        .card-footer button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 22px 52px rgba(37, 99, 235, 0.36);
        }

        .card-footer button:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .card-footer button:active:not(:disabled) {
          transform: translateY(0);
        }

        .card-footer button:disabled {
          opacity: 0.72;
          cursor: wait;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .premium-page {
            padding: 20px 12px 46px;
          }

          .hero,
          .state-card,
          .scenario-card {
            border-radius: 24px;
            padding: 22px;
          }

          .hero h1 {
            font-size: 38px;
          }

          .scenario-grid {
            grid-template-columns: 1fr;
          }

          .card-footer button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}