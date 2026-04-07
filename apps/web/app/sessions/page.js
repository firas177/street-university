"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import { getSessions } from "../lib/api";

function formatDate(dateValue) {
  if (!dateValue) return "Date inconnue";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getSessionTimestamp(session) {
  return new Date(
    session?.updated_at || session?.created_at || session?.started_at || 0
  ).getTime();
}

function getScenarioTitle(session) {
  return (
    session?.scenario?.title ||
    session?.scenario_title ||
    session?.title ||
    "Session sans titre"
  );
}

function getScenarioCategory(session) {
  return session?.scenario?.category || session?.category || "Général";
}

function getScenarioDescription(session) {
  return (
    session?.scenario?.description ||
    "Aucune description disponible pour cette simulation."
  );
}

function getStatusVariant(status) {
  if (status === "completed") return "completed";
  return "active";
}

function getStatusLabel(status) {
  if (status === "completed") return "Terminée";
  if (status === "active") return "Active";
  return status || "Inconnue";
}

export default function SessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSessions() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        setLoading(true);
        setError("");

        const data = await getSessions(token);
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Sessions loading error:", err);
        setError(err?.message || "Erreur lors du chargement des sessions.");
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [router]);

  const stats = useMemo(() => {
    const sortedSessions = [...sessions].sort(
      (a, b) => getSessionTimestamp(b) - getSessionTimestamp(a)
    );

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (session) => session.status === "completed"
    ).length;
    const activeSessions = sessions.filter(
      (session) => session.status === "active"
    ).length;

    const completionRate =
      totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

    const lastSessionDate =
      sortedSessions.length > 0
        ? formatDate(
            sortedSessions[0]?.updated_at ||
              sortedSessions[0]?.created_at ||
              sortedSessions[0]?.started_at
          )
        : "Aucune";

    return {
      sortedSessions,
      totalSessions,
      completedSessions,
      activeSessions,
      completionRate,
      lastSessionDate,
    };
  }, [sessions]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main
          style={{
            minHeight: "100vh",
            background:
              "linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #ffffff 100%)",
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
                Chargement des sessions...
              </h1>
              <p
                style={{
                  margin: "12px 0 0",
                  color: "#64748b",
                  lineHeight: 1.7,
                  fontSize: "15px",
                }}
              >
                Nous récupérons votre historique de simulations.
              </p>
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
            "linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #ffffff 100%)",
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

          <Card
            style={{
              padding: "30px",
              borderRadius: "30px",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96) 55%, rgba(37,99,235,0.78))",
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 24px 60px rgba(15,23,42,0.20)",
              color: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ maxWidth: "760px" }}>
                <p
                  style={{
                    margin: 0,
                    color: "#bfdbfe",
                    fontSize: "13px",
                    fontWeight: "800",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Historique utilisateur
                </p>

                <h1
                  style={{
                    margin: "10px 0 12px",
                    color: "#ffffff",
                    fontSize: "clamp(30px, 4vw, 46px)",
                    lineHeight: 1.05,
                    fontWeight: "900",
                    letterSpacing: "-0.04em",
                  }}
                >
                  Mes sessions
                </h1>

                <p
                  style={{
                    margin: 0,
                    color: "rgba(255,255,255,0.82)",
                    fontSize: "16px",
                    lineHeight: 1.8,
                    fontWeight: "500",
                    maxWidth: "700px",
                  }}
                >
                  Retrouvez vos anciennes simulations, suivez votre progression
                  et reprenez rapidement vos sessions actives.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "18px",
                  }}
                >
                  <Badge variant="info">
                    {stats.totalSessions} session
                    {stats.totalSessions > 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="completed">
                    {stats.completionRate}% terminées
                  </Badge>
                  <Badge variant="active">
                    Dernière activité : {stats.lastSessionDate}
                  </Badge>
                </div>
              </div>

              <div
                style={{
                  minWidth: "220px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <Button onClick={() => router.push("/scenarios")}>
                  Nouvelle simulation
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                >
                  Retour au dashboard
                </Button>
              </div>
            </div>
          </Card>

          <section>
            <SectionHeader
              eyebrow="Vue d’ensemble"
              title="Statistiques de sessions"
              description="Résumé rapide de votre activité sur les simulations."
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <StatCard
                label="Total sessions"
                value={stats.totalSessions}
                helpText="Toutes vos simulations enregistrées."
                accent="blue"
              />
              <StatCard
                label="Sessions terminées"
                value={stats.completedSessions}
                helpText="Simulations finalisées."
                accent="green"
              />
              <StatCard
                label="Sessions actives"
                value={stats.activeSessions}
                helpText="Simulations encore en cours."
                accent="amber"
              />
              <StatCard
                label="Taux de complétion"
                value={`${stats.completionRate}%`}
                helpText="Part de sessions terminées."
                accent="slate"
              />
            </div>
          </section>

          <section>
            <SectionHeader
              eyebrow="Historique"
              title="Toutes vos sessions"
              description="Cliquez sur une session pour reprendre la simulation."
            />

            {stats.sortedSessions.length === 0 ? (
              <Card
                style={{
                  padding: "24px",
                  borderRadius: "28px",
                }}
              >
                <Alert
                  type="info"
                  message="Aucune session trouvée pour le moment. Lance ta première simulation depuis la page Scénarios."
                />
              </Card>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                {stats.sortedSessions.map((session) => (
                  <Card
                    key={session.id}
                    hoverable
                    style={{
                      padding: "22px",
                      borderRadius: "24px",
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
                      <div style={{ flex: 1, minWidth: "260px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginBottom: "10px",
                          }}
                        >
                          <h2
                            style={{
                              fontSize: "1.15rem",
                              fontWeight: 800,
                              color: "#0f172a",
                              margin: 0,
                              lineHeight: 1.3,
                            }}
                          >
                            {getScenarioTitle(session)}
                          </h2>

                          <Badge variant={getStatusVariant(session?.status)}>
                            {getStatusLabel(session?.status)}
                          </Badge>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginBottom: "12px",
                          }}
                        >
                          <Badge variant="info">
                            {getScenarioCategory(session)}
                          </Badge>

                          <Badge variant="default">
                            Créée le {formatDate(session?.created_at)}
                          </Badge>
                        </div>

                        <p
                          style={{
                            color: "#475569",
                            margin: 0,
                            lineHeight: 1.7,
                            fontSize: "14px",
                          }}
                        >
                          {getScenarioDescription(session)}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          minWidth: "170px",
                        }}
                      >
                        <Button
                          onClick={() => router.push(`/session/${session.id}`)}
                        >
                          Reprendre
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => router.push("/scenarios")}
                        >
                          Nouveau scénario
                        </Button>
                      </div>
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