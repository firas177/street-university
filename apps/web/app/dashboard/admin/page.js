"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import StatCard from "../../components/ui/StatCard";
import { getMe, getScenarios } from "../../lib/api";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminDashboard() {
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
        setError(err?.message || "Impossible de charger le dashboard admin.");
      } finally {
        setLoading(false);
      }
    }

    loadAdminDashboard();
  }, [router]);

  const totalScenarios = scenarios.length;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <Card style={{ padding: "28px", borderRadius: "28px" }}>
              <p className="eyebrow">Admin</p>
              <h1 className="hero-title">Chargement du dashboard admin...</h1>
              <p className="hero-text">
                Nous préparons les outils d’administration.
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
                <p className="eyebrow">Dashboard admin</p>
                <h1 className="hero-title">Bienvenue, administrateur</h1>
                <p className="hero-text">
                  Gère les scénarios, les utilisateurs et les accès de la
                  plateforme depuis l’espace administrateur.
                </p>
                {user?.email && (
                  <p className="admin-email">Connecté avec : {user.email}</p>
                )}
              </div>

              <div className="hero-actions">
                <Button
                  onClick={() => router.push("/dashboard/admin/scenarios/create")}
                >
                  Créer un scénario
                </Button>
              </div>
            </div>
          </Card>

          <section style={{ marginBottom: "24px" }}>
            <SectionHeader
              eyebrow="Vue globale"
              title="Aperçu administration"
              description="Statistiques utiles pour la gestion de la plateforme."
            />

            <div className="stats-grid">
              <StatCard
                label="Scénarios"
                value={totalScenarios}
                helpText="Nombre total de scénarios disponibles."
                accent="blue"
              />
            </div>
          </section>

          <section style={{ marginBottom: "24px" }}>
            <SectionHeader
              eyebrow="Administration"
              title="Actions rapides"
              description="Accès direct aux outils importants de l’admin."
            />

            <div className="cards-grid">
              <Card style={{ padding: "22px", borderRadius: "22px" }}>
                <h3 className="card-title">Créer un scénario</h3>
                <p className="card-text">
                  Ajouter un nouveau scénario à la plateforme.
                </p>
                <div style={{ marginTop: "14px" }}>
                  <Button
                    onClick={() =>
                      router.push("/dashboard/admin/scenarios/create")
                    }
                  >
                    Ouvrir la création
                  </Button>
                </div>
              </Card>

              <Card style={{ padding: "22px", borderRadius: "22px" }}>
                <h3 className="card-title">Gérer les scénarios</h3>
                <p className="card-text">
                  Consulter tous les scénarios depuis l’espace administrateur.
                </p>
                <div style={{ marginTop: "14px" }}>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/dashboard/admin/scenarios")}
                  >
                    Voir les scénarios
                  </Button>
                </div>
              </Card>

              <Card style={{ padding: "22px", borderRadius: "22px" }}>
                <h3 className="card-title">Utilisateurs</h3>
                <p className="card-text">
                  Consulter les utilisateurs de la plateforme.
                </p>
                <div style={{ marginTop: "14px" }}>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/dashboard/admin/users")}
                  >
                    Voir les utilisateurs
                  </Button>
                </div>
              </Card>

              <Card style={{ padding: "22px", borderRadius: "22px" }}>
                <h3 className="card-title">Offres Free / Premium</h3>
                <p className="card-text">
                  Consulter la page de démonstration des plans de la plateforme.
                </p>
                <div style={{ marginTop: "14px" }}>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/pricing")}
                  >
                    Voir les offres
                  </Button>
                </div>
              </Card>
            </div>
          </section>

          <section>
            <SectionHeader
              eyebrow="Contenu"
              title="Derniers scénarios"
              description="Aperçu rapide des scénarios présents dans la plateforme."
            />

            {scenarios.length === 0 ? (
              <Card style={{ padding: "22px", borderRadius: "22px" }}>
                <p className="card-text">
                  Aucun scénario disponible pour le moment.
                </p>
              </Card>
            ) : (
              <div className="cards-grid">
                {scenarios.slice(0, 6).map((scenario) => (
                  <Card
                    key={scenario.id}
                    style={{ padding: "22px", borderRadius: "22px" }}
                  >
                    <h3 className="card-title">
                      {scenario.title || "Sans titre"}
                    </h3>
                    <p className="meta-text">
                      {scenario.category || "Sans catégorie"} •{" "}
                      {scenario.difficulty || "Niveau non défini"}
                    </p>
                    <p className="card-text">
                      {scenario.description || "Aucune description disponible."}
                    </p>

                    <div style={{ marginTop: "14px" }}>
                      <Button
                        variant="secondary"
                        onClick={() => router.push("/dashboard/admin/scenarios")}
                      >
                        Gérer
                      </Button>
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .card-title {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 800;
        }

        .card-text {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 500;
        }

        .meta-text {
          margin: 0 0 10px;
          color: #2563eb;
          font-size: 13px;
          font-weight: 700;
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

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .stats-grid,
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}