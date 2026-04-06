"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { getMe } from "../../lib/api";

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

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a, #0f172a)",
            borderRadius: "32px",
            padding: "40px",
            color: "white",
            marginBottom: "28px",
          }}
        >
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

          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              margin: 0,
              marginBottom: "12px",
            }}
          >
            Profil utilisateur
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "1.1rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Voici les informations principales de votre compte.
          </p>
        </div>

        {loading && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "20px",
            }}
          >
            Chargement du profil...
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "20px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "28px",
                padding: "32px",
              }}
            >
              <p style={{ color: "#2563eb", fontWeight: 700, marginBottom: "8px" }}>
                IDENTITÉ
              </p>
              <h2
                style={{
                  fontSize: "2.4rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginTop: 0,
                  marginBottom: "18px",
                }}
              >
                Un aperçu de ton compte.
              </h2>
              <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: "28px" }}>
                Cette page affiche les données principales de l’utilisateur connecté au backend.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ color: "#2563eb", fontWeight: 700, marginBottom: 8 }}>NOM</div>
                  <div style={{ color: "#334155" }}>{profile.full_name || "Non disponible"}</div>
                </div>

                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ color: "#2563eb", fontWeight: 700, marginBottom: 8 }}>EMAIL</div>
                  <div style={{ color: "#334155" }}>{profile.email || "Non disponible"}</div>
                </div>

                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ color: "#2563eb", fontWeight: 700, marginBottom: 8 }}>
                    IDENTIFIANT
                  </div>
                  <div style={{ color: "#334155" }}>{profile.id || "Non disponible"}</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "28px",
                padding: "32px",
              }}
            >
              <p style={{ color: "#2563eb", fontWeight: 700, marginBottom: "8px" }}>
                DÉTAILS
              </p>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginTop: 0,
                  marginBottom: "20px",
                }}
              >
                Informations principales
              </h2>

              <div style={{ display: "grid", gap: "16px" }}>
                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                    Nom complet
                  </div>
                  <div style={{ color: "#475569" }}>{profile.full_name || "Non disponible"}</div>
                </div>

                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                    Adresse email
                  </div>
                  <div style={{ color: "#475569" }}>{profile.email || "Non disponible"}</div>
                </div>

                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Rôle</div>
                  <div style={{ color: "#475569" }}>{profile.role || "student"}</div>
                </div>

                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: "18px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                    Identifiant utilisateur
                  </div>
                  <div style={{ color: "#475569", wordBreak: "break-word" }}>
                    {profile.id || "Non disponible"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}