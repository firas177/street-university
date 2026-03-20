"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import PageHeader from "../components/ui/PageHeader";
import { getProfile } from "../lib/api";

export default function DashboardPage() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const profile = await getProfile(token);
        setUser(profile);
      } catch (err) {
        setError(err?.message || "Erreur lors du chargement du dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/auth/login");
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
          Chargement du dashboard...
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
          badge="Dashboard"
          title={`Bienvenue${user?.full_name ? `, ${user.full_name}` : ""}`}
          description="Retrouve ton espace personnel, tes scénarios et ton profil."
        />

        {error && (
          <Alert type="error" style={{ marginBottom: "18px" }}>
            {error}
          </Alert>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <Card>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "#0f172a",
                fontSize: isMobile ? "24px" : "28px",
              }}
            >
              Ton espace
            </h2>

            <p
              style={{
                color: "#64748b",
                lineHeight: 1.7,
                marginTop: 0,
                marginBottom: "22px",
              }}
            >
              Accède rapidement à ton profil, explore les scénarios disponibles
              et continue ton entraînement.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: "14px",
              }}
            >
              <Card
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "#f8fafc",
                  boxShadow: "none",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#2563eb",
                    marginBottom: "8px",
                  }}
                >
                  PROFIL
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#0f172a",
                    lineHeight: 1.6,
                  }}
                >
                  Consulte tes informations personnelles.
                </div>
              </Card>

              <Card
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "#f8fafc",
                  boxShadow: "none",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#2563eb",
                    marginBottom: "8px",
                  }}
                >
                  SCÉNARIOS
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#0f172a",
                    lineHeight: 1.6,
                  }}
                >
                  Choisis une simulation pour t’entraîner.
                </div>
              </Card>

              <Card
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "#f8fafc",
                  boxShadow: "none",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#2563eb",
                    marginBottom: "8px",
                  }}
                >
                  SESSION
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#0f172a",
                    lineHeight: 1.6,
                  }}
                >
                  Continue ta progression avec l’IA.
                </div>
              </Card>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexDirection: isMobile ? "column" : "row",
                marginTop: "22px",
              }}
            >
              <Button onClick={() => router.push("/scenarios")} fullWidth={isMobile}>
                Voir les scénarios
              </Button>

              <Button
                variant="secondary"
                onClick={() => router.push("/dashboard/profile")}
                fullWidth={isMobile}
              >
                Voir mon profil
              </Button>
            </div>
          </Card>

          <Card>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                color: "#0f172a",
                fontSize: "22px",
              }}
            >
              Informations utilisateur
            </h3>

            <div style={{ display: "grid", gap: "12px" }}>
              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <strong>Nom :</strong>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  {user?.full_name || "Non disponible"}
                </p>
              </div>

              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <strong>Email :</strong>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  {user?.email || "Non disponible"}
                </p>
              </div>

              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <strong>ID :</strong>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  {user?.id || "Non disponible"}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              <Button variant="danger" onClick={handleLogout} fullWidth>
                Déconnexion
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}