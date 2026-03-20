"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { getProfile } from "../lib/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import PageHeader from "../components/ui/PageHeader";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    async function checkAuth() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Aucun token trouvé. Merci de vous reconnecter.");
          setLoading(false);
          return;
        }

        const data = await getProfile(token);
        setUser(data);
      } catch (err) {
        setError(err?.message || "Une erreur est survenue");
        setError(err.message || "Impossible de charger le dashboard");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ padding: isMobile ? "24px 14px" : "40px" }}>
          Chargement du dashboard...
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
              Erreur dashboard
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
                onClick={() => router.push("/auth/login")}
                fullWidth={isMobile}
              >
                Retour à la connexion
              </Button>

              <Button
                variant="danger"
                onClick={handleLogout}
                fullWidth={isMobile}
              >
                Supprimer le token et se reconnecter
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
          badge="Street University Dashboard"
          title={`Bienvenue ${user?.full_name || "utilisateur"}`}
          description="Accède à ton profil, lance tes futurs scénarios d’entraînement et suis ta progression."
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
          }}
        >
          <Card
            style={{
              borderRadius: isMobile ? "18px" : "22px",
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
              Mon profil
            </h2>

            <p style={{ color: "#64748b", lineHeight: 1.6, fontSize: isMobile ? "14px" : "15px" }}>
              Consulte les informations de ton compte récupérées depuis l’API.
            </p>

            <div style={{ marginTop: "12px" }}>
              <Button
                variant="blue"
                onClick={() => router.push("/dashboard/profile")}
                fullWidth={isMobile}
              >
                Voir le profil
              </Button>
            </div>
          </Card>

          <Card
            style={{
              borderRadius: isMobile ? "18px" : "22px",
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
              Scénarios
            </h2>

            <p style={{ color: "#64748b", lineHeight: 1.6, fontSize: isMobile ? "14px" : "15px" }}>
              Cette section affichera les simulations disponibles : entretien, pitch, négociation, etc.
            </p>

            <div style={{ marginTop: "12px" }}>
              <Button
                onClick={() => router.push("/scenarios")}
                fullWidth={isMobile}
              >
                Ouvrir les scénarios
              </Button>
            </div>
          </Card>

          <Card
            style={{
              borderRadius: isMobile ? "18px" : "22px",
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
              Déconnexion
            </h2>

            <p style={{ color: "#64748b", lineHeight: 1.6, fontSize: isMobile ? "14px" : "15px" }}>
              Ferme ta session et retourne vers la page de connexion.
            </p>

            <div style={{ marginTop: "12px" }}>
              <Button
                variant="danger"
                onClick={handleLogout}
                fullWidth={isMobile}
              >
                Se déconnecter
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}