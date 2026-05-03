"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
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

  return (
    <>
      <Navbar />

      <main className="premium-page">
        <div className="page-container">
          {error && (
            <Alert type="warning" style={{ marginBottom: "18px" }}>
              {error}
            </Alert>
          )}

          <section className="hero-card">
            <div>
              <p className="eyebrow">Profil étudiant</p>
              <h1>{loading ? "Chargement du profil..." : "Compte et CV IA"}</h1>
              <p>
                Gérez les informations du compte et accédez au profil CV utilisé
                par Street University pour personnaliser les simulations.
              </p>
            </div>

            <div className="action-panel">
              <button onClick={() => router.push("/pricing")}>
                Passer au Premium
              </button>
              <button onClick={() => router.push("/dashboard/profile/cv")}>
                Gérer mon CV IA
              </button>
            </div>
          </section>

          {!loading && (
            <>
              <section className="plan-card">
                <div>
                  <p className="eyebrow">Plan actuel</p>
                  <h2>{isPremium ? "Premium" : "Free"}</h2>
                  <p>
                    {isPremium
                      ? "Vous avez accès aux fonctionnalités avancées de Street University."
                      : "Vous êtes actuellement sur le plan gratuit avec accès de base."}
                  </p>
                </div>
                <span className={`plan-badge ${isPremium ? "premium" : "free"}`}>
                  {isPremium ? "Premium" : "Free"}
                </span>
              </section>

              <section className="info-grid">
                <article>
                  <span>Nom complet</span>
                  <strong>{profile?.full_name || "—"}</strong>
                </article>
                <article>
                  <span>Adresse email</span>
                  <strong className="break">{profile?.email || "—"}</strong>
                </article>
                <article>
                  <span>Rôle</span>
                  <strong>{profile?.role || "student"}</strong>
                </article>
                <article>
                  <span>Identifiant utilisateur</span>
                  <strong className="break">{profile?.id || "—"}</strong>
                </article>
              </section>
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        .premium-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 10% 0%, rgba(37, 99, 235, 0.3), transparent 30%),
            radial-gradient(circle at 90% 10%, rgba(124, 58, 237, 0.22), transparent 30%),
            linear-gradient(180deg, #030712 0%, #0f172a 58%, #eef4ff 100%);
          padding: 34px 20px 76px;
          color: #f8fafc;
        }

        .page-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero-card,
        .plan-card,
        .info-grid article {
          border: 1px solid rgba(147, 197, 253, 0.22);
          border-radius: 30px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.52)),
            rgba(255, 255, 255, 0.08);
          box-shadow: 0 28px 90px rgba(2, 6, 23, 0.28);
          backdrop-filter: blur(18px);
        }

        .hero-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 24px;
          padding: 34px;
          margin-bottom: 18px;
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

        h1 {
          margin: 0;
          font-size: clamp(40px, 6vw, 68px);
          line-height: 0.98;
          font-weight: 950;
        }

        .hero-card p,
        .plan-card p {
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.75;
          margin: 14px 0 0;
        }

        .action-panel {
          display: grid;
          gap: 12px;
          align-content: center;
        }

        .action-panel button {
          min-height: 50px;
          border: 1px solid rgba(147, 197, 253, 0.28);
          border-radius: 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(96, 165, 250, 0.1));
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .action-panel button:first-child {
          background: linear-gradient(135deg, #ffffff, #93c5fd 54%, #22d3ee);
          color: #0f172a;
        }

        .plan-card {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          padding: 28px;
          margin-bottom: 18px;
        }

        .plan-card h2 {
          margin: 0;
          color: #ffffff;
          font-size: 34px;
          font-weight: 950;
        }

        .plan-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 9px 16px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 950;
        }

        .plan-badge.free {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .plan-badge.premium {
          background: #fef3c7;
          color: #92400e;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .info-grid article {
          padding: 24px;
        }

        .info-grid span {
          display: block;
          color: #93c5fd;
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .info-grid strong {
          display: block;
          color: #ffffff;
          font-size: 20px;
          line-height: 1.45;
          font-weight: 900;
        }

        .break {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        @media (max-width: 800px) {
          .hero-card,
          .plan-card {
            grid-template-columns: 1fr;
            flex-direction: column;
            align-items: stretch;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .premium-page {
            padding: 20px 12px 46px;
          }

          .hero-card,
          .plan-card,
          .info-grid article {
            border-radius: 24px;
            padding: 22px;
          }

          h1 {
            font-size: 38px;
          }
        }
      `}</style>
    </>
  );
}
