"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import { getProfile } from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentPlan = "Free";
  const isPremium = currentPlan === "Premium";

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        const data = await getProfile(token);
        setProfile(data || null);
      } catch (err) {
        setError(err.message || "Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <Card style={{ padding: "28px", borderRadius: "28px" }}>
              <h1 className="page-title">Chargement du profil...</h1>
              <p className="page-text">
                Nous récupérons les informations du compte.
              </p>
            </Card>
          </div>
        </main>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #ffffff 100%);
            padding: 32px 20px 60px;
          }

          .page-container {
            max-width: 900px;
            margin: 0 auto;
          }

          .page-title {
            margin: 0;
            color: #0f172a;
            font-size: clamp(28px, 4vw, 40px);
            line-height: 1.1;
            font-weight: 900;
            letter-spacing: -0.03em;
          }

          .page-text {
            margin: 12px 0 0;
            color: #64748b;
            font-size: 15px;
            line-height: 1.7;
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
            <Alert type="warning" style={{ marginBottom: "18px" }}>
              {error}
            </Alert>
          )}

          <Card
            style={{
              padding: "28px",
              borderRadius: "28px",
            }}
          >
            <div className="top-actions">
              <Button
                variant="blue"
                onClick={() => router.push("/pricing")}
              >
                Passer au Premium
              </Button>
            </div>

            <div className="plan-banner">
              <div>
                <p className="plan-label">Plan actuel</p>
                <h3 className="plan-title">{isPremium ? "Premium" : "Free"}</h3>
                <p className="plan-description">
                  {isPremium
                    ? "Vous avez accès aux fonctionnalités avancées de Street University."
                    : "Vous êtes actuellement sur le plan gratuit avec accès de base."}
                </p>
              </div>

              <span className={`plan-badge ${isPremium ? "premium" : "free"}`}>
                {isPremium ? "Premium" : "Free"}
              </span>
            </div>

            <h1 className="section-title">Informations principales</h1>

            <div className="info-list">
              <div className="info-card">
                <h3 className="info-title">Nom complet</h3>
                <p className="info-value">{profile?.full_name || "—"}</p>
              </div>

              <div className="info-card">
                <h3 className="info-title">Adresse email</h3>
                <p className="info-value email-break">{profile?.email || "—"}</p>
              </div>

              <div className="info-card">
                <h3 className="info-title">Rôle</h3>
                <p className="info-value">{profile?.role || "student"}</p>
              </div>

              <div className="info-card">
                <h3 className="info-title">Identifiant utilisateur</h3>
                <p className="info-value id-break">{profile?.id || "—"}</p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #ffffff 100%);
          padding: 32px 20px 60px;
        }

        .page-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .top-actions {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 20px;
        }

        .plan-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 20px 22px;
          border-radius: 22px;
          background: linear-gradient(135deg, #ffffff, #eff6ff);
          border: 1px solid #dbeafe;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
          margin-bottom: 22px;
        }

        .plan-label {
          margin: 0 0 6px;
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .plan-title {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 24px;
          font-weight: 900;
        }

        .plan-description {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
          max-width: 560px;
        }

        .plan-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid transparent;
          min-width: 90px;
        }

        .plan-badge.free {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }

        .plan-badge.premium {
          background: #fef3c7;
          color: #b45309;
          border-color: #fcd34d;
        }

        .section-title {
          margin: 0 0 22px;
          color: #0f172a;
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1.08;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .info-list {
          display: grid;
          gap: 18px;
        }

        .info-card {
          border: 1px solid #dbeafe;
          border-radius: 22px;
          padding: 20px;
          background: #ffffff;
        }

        .info-title {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
        }

        .info-value {
          margin: 0;
          color: #475569;
          font-size: 15px;
          line-height: 1.75;
          word-break: break-word;
        }

        .email-break,
        .id-break {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        @media (max-width: 700px) {
          .page-shell {
            padding: 20px 12px 36px;
          }

          .section-title {
            font-size: 32px;
          }

          .top-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .plan-banner {
            padding: 18px;
          }

          .plan-title {
            font-size: 20px;
          }

          .plan-badge {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}