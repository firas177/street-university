"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Card from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { getMe } from "../../lib/api";

function InfoMiniCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #dbeafe",
        borderRadius: "18px",
        padding: "18px",
        background: "#f8fafc",
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: "#2563eb",
          fontWeight: 700,
          marginBottom: 8,
          fontSize: "14px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#334155",
          wordBreak: "break-word",
          lineHeight: 1.6,
          fontSize: "15px",
        }}
      >
        {value || "Non disponible"}
      </div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #dbeafe",
        borderRadius: "18px",
        padding: "18px",
        background: "#f8fafc",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 8,
          fontSize: "15px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#475569",
          wordBreak: "break-word",
          lineHeight: 1.65,
          fontSize: "15px",
        }}
      >
        {value || "Non disponible"}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        const data = await getMe(token);
        setProfile(data);
      } catch (err) {
        setError(err.message || "Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
      }}
    >
      <Navbar />

      <main className="profile-shell">
        <div className="hero-card">
          <div
            style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              marginBottom: "18px",
              fontWeight: 600,
            }}
          >
            Mon profil
          </div>

          <h1 className="hero-title">Profil utilisateur</h1>

          <p className="hero-text">
            Voici les informations principales de votre compte.
          </p>
        </div>

        {loading && (
          <Card
            style={{
              padding: "20px",
              borderRadius: "20px",
            }}
          >
            Chargement du profil...
          </Card>
        )}

        {error && !loading && (
          <Alert
            type="error"
            message={error}
            style={{ borderRadius: "20px", marginBottom: "20px" }}
          />
        )}

        {!loading && !error && profile && (
          <div className="profile-grid">
            <Card
              style={{
                borderRadius: "28px",
                padding: "32px",
              }}
            >
              <p className="section-eyebrow">IDENTITÉ</p>

              <h2 className="section-title">Un aperçu de ton compte.</h2>

              <p className="section-description">
                Cette page affiche les données principales de l’utilisateur
                connecté au backend.
              </p>

              <div className="mini-grid">
                <InfoMiniCard
                  label="NOM"
                  value={profile.full_name || "Non disponible"}
                />
                <InfoMiniCard
                  label="EMAIL"
                  value={profile.email || "Non disponible"}
                />
                <InfoMiniCard
                  label="IDENTIFIANT"
                  value={profile.id || "Non disponible"}
                />
              </div>
            </Card>

            <Card
              style={{
                borderRadius: "28px",
                padding: "32px",
              }}
            >
              <p className="section-eyebrow">DÉTAILS</p>

              <h2
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2rem)",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginTop: 0,
                  marginBottom: "20px",
                  lineHeight: 1.15,
                }}
              >
                Informations principales
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                <DetailCard
                  label="Nom complet"
                  value={profile.full_name || "Non disponible"}
                />

                <DetailCard
                  label="Adresse email"
                  value={profile.email || "Non disponible"}
                />

                <DetailCard
                  label="Rôle"
                  value={profile.role || "student"}
                />

                <DetailCard
                  label="Identifiant utilisateur"
                  value={profile.id || "Non disponible"}
                />
              </div>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <Button onClick={() => router.push("/dashboard")}>
                  Retour au dashboard
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => router.push("/sessions")}
                >
                  Voir mes sessions
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      <style jsx>{`
        .profile-shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px 48px;
        }

        .hero-card {
          background: linear-gradient(135deg, #1e3a8a, #0f172a);
          border-radius: 32px;
          padding: 40px;
          color: white;
          margin-bottom: 28px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
        }

        .hero-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          margin: 0 0 12px;
          line-height: 1.05;
        }

        .hero-text {
          margin: 0;
          font-size: 1.05rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          max-width: 700px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .section-eyebrow {
          color: #2563eb;
          font-weight: 700;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .section-title {
          font-size: clamp(1.9rem, 4vw, 2.4rem);
          font-weight: 800;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 18px;
          line-height: 1.1;
        }

        .section-description {
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 28px;
          font-size: 15px;
        }

        .mini-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        @media (max-width: 960px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }

          .mini-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .profile-shell {
            padding: 20px 12px 36px;
          }

          .hero-card {
            padding: 24px 20px;
            border-radius: 24px;
            margin-bottom: 20px;
          }

          .hero-text {
            font-size: 0.98rem;
          }

          .mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}