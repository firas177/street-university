"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
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

  return (
    <>
      <Navbar />

      {loading ? (
        <main className="sessions-shell loading">
          <div className="page-container">
            <div className="loading-card">
              <div className="loading-orbit" aria-hidden>
                <span />
              </div>
              <p className="eyebrow">Sessions</p>
              <h1>Chargement de votre historique</h1>
              <p className="lead">
                Nous récupérons vos simulations et votre dernière activité.
              </p>
            </div>
          </div>
        </main>
      ) : (
        <main className="sessions-shell">
        <div className="page-container">
          {error && (
            <Alert type="error" style={{ marginBottom: "18px", borderRadius: "18px", fontSize: "15px" }}>
              {error}
            </Alert>
          )}

          <section className="hero-card">
            <div className="hero-copy">
              <p className="eyebrow">Historique utilisateur</p>
              <h1>Mes sessions</h1>
              <p className="lead">
                Retrouvez vos simulations, suivez votre progression et reprenez une session active en un clic.
              </p>
              <div className="badge-row">
                <Badge variant="info">
                  {stats.totalSessions} session{stats.totalSessions > 1 ? "s" : ""}
                </Badge>
                <Badge variant="completed">{stats.completionRate}% terminées</Badge>
                <Badge variant="active">Dernière activité : {stats.lastSessionDate}</Badge>
              </div>
            </div>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => router.push("/scenarios")}>
                Nouvelle simulation
              </button>
              <button type="button" className="btn btn-glass" onClick={() => router.push("/dashboard")}>
                Retour au dashboard
              </button>
            </div>
          </section>

          <section className="block">
            <header className="block-head">
              <p className="eyebrow">Vue d’ensemble</p>
              <h2>Statistiques de sessions</h2>
              <p className="block-desc">Résumé rapide de votre activité sur les simulations.</p>
            </header>
            <div className="stat-grid">
              <article className="stat-card">
                <span className="stat-label">Total sessions</span>
                <strong className="stat-value">{stats.totalSessions}</strong>
                <p className="stat-help">Toutes vos simulations enregistrées.</p>
              </article>
              <article className="stat-card">
                <span className="stat-label">Sessions terminées</span>
                <strong className="stat-value">{stats.completedSessions}</strong>
                <p className="stat-help">Simulations finalisées.</p>
              </article>
              <article className="stat-card">
                <span className="stat-label">Sessions actives</span>
                <strong className="stat-value">{stats.activeSessions}</strong>
                <p className="stat-help">Simulations encore en cours.</p>
              </article>
              <article className="stat-card">
                <span className="stat-label">Taux de complétion</span>
                <strong className="stat-value">{stats.completionRate}%</strong>
                <p className="stat-help">Part de sessions terminées.</p>
              </article>
            </div>
          </section>

          <section className="block">
            <header className="block-head">
              <p className="eyebrow">Historique</p>
              <h2>Toutes vos sessions</h2>
              <p className="block-desc">Ouvrez une session pour reprendre la simulation.</p>
            </header>

            {stats.sortedSessions.length === 0 ? (
              <div className="empty-wrap">
                <Alert type="info" style={{ borderRadius: "20px", fontSize: "15px" }}>
                  Aucune session trouvée pour le moment. Lance ta première simulation depuis la page Scénarios.
                </Alert>
              </div>
            ) : (
              <div className="session-list">
                {stats.sortedSessions.map((session) => (
                  <article key={session.id} className="session-card">
                    <div className="session-body">
                      <div className="session-title-row">
                        <h2>{getScenarioTitle(session)}</h2>
                        <Badge variant={getStatusVariant(session?.status)}>
                          {getStatusLabel(session?.status)}
                        </Badge>
                      </div>
                      <div className="session-meta">
                        <Badge variant="info">{getScenarioCategory(session)}</Badge>
                        <Badge variant="default">Créée le {formatDate(session?.created_at)}</Badge>
                      </div>
                      <p className="session-desc">{getScenarioDescription(session)}</p>
                    </div>
                    <div className="session-aside">
                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={() => router.push(`/session/${session.id}`)}
                      >
                        Reprendre
                      </button>
                      <button
                        type="button"
                        className="btn btn-glass btn-block"
                        onClick={() => router.push("/scenarios")}
                      >
                        Nouveau scénario
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      )}

      <style jsx>{`
        .sessions-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 0%, rgba(59, 130, 246, 0.38), transparent 30%),
            radial-gradient(circle at 92% 12%, rgba(124, 58, 237, 0.28), transparent 28%),
            linear-gradient(180deg, #030712 0%, #0f172a 56%, #e8eefc 100%);
          padding: 32px 20px 72px;
          color: #f8fafc;
        }

        .sessions-shell.loading {
          display: grid;
          place-items: center;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading-card {
          width: min(640px, 100%);
          border-radius: 32px;
          border: 1px solid rgba(147, 197, 253, 0.28);
          padding: 40px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.55)),
            rgba(255, 255, 255, 0.08);
          box-shadow: 0 32px 90px rgba(2, 6, 23, 0.4);
          backdrop-filter: blur(20px);
          text-align: center;
        }

        .loading-orbit {
          width: 56px;
          height: 56px;
          margin: 0 auto 20px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.08);
        }

        .loading-orbit span {
          width: 26px;
          height: 26px;
          border: 3px solid rgba(191, 219, 254, 0.5);
          border-top-color: #ffffff;
          border-radius: 999px;
          animation: spin 0.85s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #93c5fd;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          line-height: 1.4;
        }

        .loading-card h1,
        .hero-card h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 44px);
          line-height: 1.1;
          font-weight: 950;
          color: #ffffff;
        }

        .lead,
        .block-desc {
          margin: 14px 0 0;
          font-size: 16px;
          line-height: 1.75;
          color: #dbeafe;
          font-weight: 500;
          max-width: 720px;
        }

        .loading-card .lead {
          margin-left: auto;
          margin-right: auto;
        }

        .hero-card {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 24px;
          padding: 32px;
          margin-bottom: 28px;
          border-radius: 32px;
          border: 1px solid rgba(147, 197, 253, 0.26);
          background:
            linear-gradient(135deg, rgba(3, 7, 18, 0.92), rgba(15, 23, 42, 0.82)),
            radial-gradient(circle at 80% 0%, rgba(37, 99, 235, 0.35), transparent 40%);
          box-shadow: 0 32px 100px rgba(2, 6, 23, 0.38);
          backdrop-filter: blur(22px);
        }

        .hero-copy {
          flex: 1;
          min-width: 260px;
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 220px;
        }

        .btn {
          appearance: none;
          font-family: inherit;
          cursor: pointer;
          border-radius: 999px;
          font-size: 16px;
          font-weight: 850;
          min-height: 50px;
          padding: 14px 22px;
          border: 1px solid transparent;
          transition:
            transform 0.18s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .btn:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-primary {
          background: linear-gradient(135deg, #ffffff 0%, #bfdbfe 50%, #22d3ee 100%);
          color: #0f172a;
          box-shadow: 0 18px 48px rgba(37, 99, 235, 0.32);
        }

        .btn-glass {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(96, 165, 250, 0.1));
          color: #f8fafc;
          border-color: rgba(147, 197, 253, 0.35);
          backdrop-filter: blur(12px);
        }

        .btn-glass:hover:not(:disabled) {
          border-color: rgba(34, 211, 238, 0.65);
        }

        .btn-block {
          width: 100%;
        }

        .block {
          margin-bottom: 36px;
        }

        .block-head h2 {
          margin: 8px 0 0;
          font-size: clamp(22px, 2.8vw, 30px);
          font-weight: 950;
          color: #ffffff;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .stat-card {
          border-radius: 24px;
          border: 1px solid rgba(147, 197, 253, 0.22);
          padding: 22px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.5)),
            rgba(255, 255, 255, 0.06);
          box-shadow: 0 22px 70px rgba(2, 6, 23, 0.28);
          backdrop-filter: blur(16px);
        }

        .stat-label {
          display: block;
          color: #93c5fd;
          font-size: 14px;
          font-weight: 850;
          margin-bottom: 10px;
        }

        .stat-value {
          display: block;
          font-size: clamp(30px, 4vw, 40px);
          font-weight: 950;
          color: #ffffff;
          line-height: 1;
        }

        .stat-help {
          margin: 12px 0 0;
          font-size: 15px;
          line-height: 1.65;
          color: #c7d2fe;
        }

        .empty-wrap {
          border-radius: 26px;
        }

        .session-list {
          display: grid;
          gap: 16px;
        }

        .session-card {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 20px;
          padding: 24px;
          border-radius: 26px;
          border: 1px solid rgba(147, 197, 253, 0.22);
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.55)),
            rgba(255, 255, 255, 0.07);
          box-shadow: 0 24px 70px rgba(2, 6, 23, 0.3);
          backdrop-filter: blur(18px);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .session-card:hover {
          border-color: rgba(34, 211, 238, 0.45);
          transform: translateY(-3px);
        }

        .session-body {
          flex: 1;
          min-width: 260px;
        }

        .session-title-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .session-title-row h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 950;
          color: #ffffff;
          line-height: 1.3;
        }

        .session-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }

        .session-desc {
          margin: 0;
          font-size: 16px;
          line-height: 1.7;
          color: #dbeafe;
        }

        .session-aside {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 200px;
        }

        @media (max-width: 720px) {
          .sessions-shell {
            padding: 22px 14px 56px;
          }

          .hero-card {
            padding: 24px 20px;
          }

          .hero-actions {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
