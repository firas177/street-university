"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import SectionHeader from "../../../components/ui/SectionHeader";
import { getMe, getScenarios, deleteScenario } from "../../../lib/api";

export default function AdminScenariosPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        setLoading(true);
        setError("");

        const me = await getMe(token);

        if (!me || me.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setUser(me);

        const scenariosData = await getScenarios(token);
        setScenarios(Array.isArray(scenariosData) ? scenariosData : []);
      } catch (err) {
        setError(err?.message || "Impossible de charger les scénarios admin.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [router]);

  async function handleDeleteScenario(scenarioId) {
    const confirmDelete = window.confirm(
      "Voulez-vous vraiment supprimer ce scénario ?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      await deleteScenario(token, scenarioId);

      setScenarios((prev) =>
        prev.filter((scenario) => scenario.id !== scenarioId)
      );

      alert("Scénario supprimé avec succès.");
    } catch (err) {
      alert(err?.message || "Erreur lors de la suppression du scénario.");
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <Card style={{ padding: "28px", borderRadius: "28px" }}>
              <p className="eyebrow">Admin</p>
              <h1 className="hero-title">Chargement des scénarios...</h1>
              <p className="hero-text">
                Nous préparons la liste des scénarios de la plateforme.
              </p>
            </Card>
          </div>
        </main>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            background: linear-gradient(
              180deg,
              #f8fbff 0%,
              #eef4ff 45%,
              #ffffff 100%
            );
            padding: 32px 20px 60px;
          }

          .page-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .eyebrow {
            margin: 0;
            color: #2563eb;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .hero-title {
            margin: 12px 0 10px;
            color: #0f172a;
            font-size: clamp(30px, 4vw, 46px);
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -0.04em;
          }

          .hero-text {
            margin: 0;
            color: #64748b;
            font-size: 16px;
            line-height: 1.8;
            font-weight: 500;
            max-width: 700px;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-container">
          {error && (
            <Alert
              type="error"
              style={{ marginBottom: "18px", borderRadius: "18px" }}
            >
              {error}
            </Alert>
          )}

          <Card
            style={{
              padding: "32px",
              borderRadius: "30px",
              background:
                "linear-gradient(135deg, #ffffff, #eff6ff 50%, #dbeafe)",
              border: "1px solid #dbeafe",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
              marginBottom: "24px",
            }}
          >
            <div className="hero-row">
              <div className="hero-main">
                <p className="eyebrow">Admin scénarios</p>
                <h1 className="hero-title">Gestion des scénarios</h1>
                <p className="hero-text">
                  Consulte les scénarios existants et prépare leur gestion depuis
                  l’espace administrateur.
                </p>

                {user?.email && (
                  <p className="admin-email">Connecté avec : {user.email}</p>
                )}
              </div>

              <div className="hero-actions">
                <Button
                  onClick={() =>
                    router.push("/dashboard/admin/scenarios/create")
                  }
                >
                  Créer un scénario
                </Button>
              </div>
            </div>
          </Card>

          <section>
            <SectionHeader
              eyebrow="Administration"
              title="Liste des scénarios"
              description="Vue admin des scénarios actuellement présents dans la plateforme."
            />

            {scenarios.length === 0 ? (
              <Card style={{ padding: "22px", borderRadius: "22px" }}>
                <p className="card-text">
                  Aucun scénario disponible pour le moment.
                </p>
              </Card>
            ) : (
              <div className="cards-grid">
                {scenarios.map((scenario) => (
                  <Card
                    key={scenario.id}
                    style={{ padding: "22px", borderRadius: "22px" }}
                  >
                    <div className="card-top">
                      <div>
                        <h3 className="card-title">
                          {scenario.title || "Sans titre"}
                        </h3>

                        <p className="meta-text">
                          {scenario.category || "Sans catégorie"} •{" "}
                          {scenario.difficulty || "Niveau non défini"}
                        </p>
                      </div>
                    </div>

                    <p className="card-text">
                      {scenario.description || "Aucune description disponible."}
                    </p>

                    <div className="card-actions">
                      <Button
                        variant="secondary"
                        onClick={() => router.push("/scenarios")}
                      >
                        Voir côté user
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDeleteScenario(scenario.id)}
                        className="delete-button"
                      >
                        Supprimer
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background: linear-gradient(
            180deg,
            #f8fbff 0%,
            #eef4ff 45%,
            #ffffff 100%
          );
          padding: 32px 20px 60px;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-main {
          max-width: 760px;
          min-width: 0;
          flex: 1;
        }

        .eyebrow {
          margin: 0;
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 12px 0 10px;
          color: #0f172a;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .hero-text {
          margin: 0;
          color: #334155;
          font-size: 16px;
          line-height: 1.8;
          font-weight: 500;
          max-width: 700px;
        }

        .admin-email {
          margin: 14px 0 0;
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          word-break: break-word;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .card-title {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 800;
        }

        .meta-text {
          margin: 0;
          color: #2563eb;
          font-size: 13px;
          font-weight: 700;
        }

        .card-text {
          margin: 14px 0 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 500;
        }

        .card-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .delete-button {
          border: 1px solid #fecaca;
          background: #ffffff;
          color: #dc2626;
          border-radius: 16px;
          padding: 14px 22px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .delete-button:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .page-shell {
            padding: 28px 18px 48px;
          }

          .hero-row {
            flex-direction: column;
            align-items: stretch;
          }

          .hero-actions {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .page-shell {
            padding: 20px 12px 36px;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-text {
            font-size: 15px;
            line-height: 1.7;
          }

          .hero-actions,
          .card-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }

          .delete-button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}