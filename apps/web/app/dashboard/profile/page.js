"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "../../lib/api";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
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
    async function loadProfile() {
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
        setError(err.message || "Impossible de charger le profil");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ padding: isMobile ? "24px 14px" : "40px", fontSize: "18px" }}>
          Chargement du profil...
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
              Erreur profil
            </h1>

            <p style={{ color: "#334155", lineHeight: 1.6 }}>{error}</p>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "12px",
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
          maxWidth: "900px",
          margin: "0 auto",
          padding: isMobile ? "20px 14px" : "32px 20px",
        }}
      >
        <Card
          style={{
            borderRadius: isMobile ? "18px" : "24px",
            padding: isMobile ? "20px" : "32px",
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
          }}
        >
          <PageHeader
            badge="Mon profil"
            title="Profil utilisateur"
            description="Voici les informations récupérées depuis ton backend."
          />

          <div style={{ display: "grid", gap: "16px" }}>
            <Card
              style={{
                padding: isMobile ? "16px" : "18px",
                borderRadius: "16px",
                background: "#f8fafc",
                boxShadow: "none",
              }}
            >
              <strong style={{ color: "#0f172a" }}>Nom :</strong>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#334155",
                  fontSize: isMobile ? "14px" : "16px",
                  wordBreak: "break-word",
                }}
              >
                {user?.full_name || "Non disponible"}
              </p>
            </Card>

            <Card
              style={{
                padding: isMobile ? "16px" : "18px",
                borderRadius: "16px",
                background: "#f8fafc",
                boxShadow: "none",
              }}
            >
              <strong style={{ color: "#0f172a" }}>Email :</strong>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#334155",
                  fontSize: isMobile ? "14px" : "16px",
                  wordBreak: "break-word",
                }}
              >
                {user?.email || "Non disponible"}
              </p>
            </Card>

            <Card
              style={{
                padding: isMobile ? "16px" : "18px",
                borderRadius: "16px",
                background: "#f8fafc",
                boxShadow: "none",
              }}
            >
              <strong style={{ color: "#0f172a" }}>ID :</strong>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#334155",
                  fontSize: isMobile ? "14px" : "16px",
                  wordBreak: "break-word",
                }}
              >
                {user?.id || "Non disponible"}
              </p>
            </Card>
          </div>

          <div
            style={{
              marginTop: "28px",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "12px",
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