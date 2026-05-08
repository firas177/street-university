"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Alert from "../../../components/ui/Alert";
import {
  getAdminAnalyticsUsers,
  getAdminUserProgress,
  getMe,
} from "../../../lib/api";

const SORT_OPTIONS = [
  { value: "average_score", label: "Moyenne" },
  { value: "communication_average", label: "Communication" },
  { value: "confidence_average", label: "Confiance" },
  { value: "clarity_average", label: "Clarté" },
  { value: "relevance_average", label: "Pertinence" },
  { value: "professionalism_average", label: "Professionnalisme" },
  { value: "sessions_count", label: "Sessions" },
  { value: "completed_sessions_count", label: "Sessions terminées" },
  { value: "created_at", label: "Date de création" },
];

function formatScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return `${num.toFixed(1)} / 10`;
}

function toPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, num * 10));
}

function formatDate(value) {
  if (!value) return "Non disponible";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Date invalide";
  }
}

function sentimentLabel(value) {
  const v = String(value || "").toLowerCase();
  if (v === "positive") return "Positif";
  if (v === "negative") return "Négatif";
  if (v === "neutral") return "Neutre";
  return "Non disponible";
}

function sentimentTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "positive") return "positive";
  if (v === "negative") return "negative";
  if (v === "neutral") return "neutral";
  return "empty";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const [sortBy, setSortBy] = useState("average_score");
  const [order, setOrder] = useState("desc");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.replace("/auth/login");
          return;
        }

        setLoading(true);
        setError("");
        setAccessDenied(false);

        const me = await getMe(token);
        if (!me || me.role !== "admin") {
          setAccessDenied(true);
          return;
        }

        const rows = await getAdminAnalyticsUsers(token, sortBy, order);
        setUsers(Array.isArray(rows) ? rows : []);
      } catch (err) {
        const msg = err?.message || "Impossible de charger les utilisateurs.";
        setError(msg);
        if (msg.toLowerCase().includes("accès refusé") || msg.includes("403")) {
          setAccessDenied(true);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [router, sortBy, order]);

  async function handleViewEvolution(userId) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setSelectedUserId(userId);
      setProgress(null);
      setProgressError("");
      setProgressLoading(true);

      const data = await getAdminUserProgress(token, userId);
      setProgress(data || null);
    } catch (err) {
      const msg =
        err?.message || "Impossible de charger la progression utilisateur.";
      setProgressError(msg);
      if (msg.toLowerCase().includes("accès refusé") || msg.includes("403")) {
        setAccessDenied(true);
      }
    } finally {
      setProgressLoading(false);
    }
  }

  const evolutionPoints = useMemo(() => {
    const items = progress?.progression;
    if (!Array.isArray(items)) return [];
    return items
      .map((item, idx) => ({
        idx,
        score: Number(item?.overall_score),
      }))
      .filter((p) => Number.isFinite(p.score));
  }, [progress]);

  const evolutionPolyline = useMemo(() => {
    if (evolutionPoints.length <= 1) return "";
    return evolutionPoints
      .map((point, idx) => {
        const x =
          evolutionPoints.length === 1
            ? 30
            : 30 + (idx / (evolutionPoints.length - 1)) * 320;
        const y = 170 - Math.max(0, Math.min(10, point.score)) * 14;
        return `${x},${y}`;
      })
      .join(" ");
  }, [evolutionPoints]);

  const firstScore =
    evolutionPoints.length > 0 ? Number(evolutionPoints[0].score) : null;
  const latestScore =
    evolutionPoints.length > 0
      ? Number(evolutionPoints[evolutionPoints.length - 1].score)
      : null;
  const improvement =
    Number.isFinite(firstScore) && Number.isFinite(latestScore)
      ? Number((latestScore - firstScore).toFixed(1))
      : null;

  let insight = "Pas assez de données";
  if (improvement !== null) {
    if (improvement > 0) insight = "Progression positive";
    else if (improvement < 0) insight = "Progression à renforcer";
    else insight = "Performance stable";
  }

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="container">
          {error && (
            <Alert type="error" style={{ marginBottom: "16px" }}>
              {error}
            </Alert>
          )}

          {accessDenied && (
            <Alert type="error" style={{ marginBottom: "16px" }}>
              Accès réservé aux administrateurs.
            </Alert>
          )}

          <section className="hero card">
            <div>
              <p className="eyebrow">Admin analytics</p>
              <h1>Analyse des utilisateurs</h1>
              <p>
                Suivez les performances, la progression et les statistiques
                détaillées de chaque utilisateur.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-glass"
              onClick={() => router.push("/dashboard/admin")}
            >
              Retour dashboard admin
            </button>
          </section>

          <section className="card controls">
            <div>
              <label htmlFor="sortBy">Trier par</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="order">Ordre</label>
              <select
                id="order"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              >
                <option value="desc">Descendant</option>
                <option value="asc">Ascendant</option>
              </select>
            </div>
          </section>

          <section className="layout">
            <div className="card table-card">
              {loading ? (
                <p className="empty">Chargement des utilisateurs...</p>
              ) : users.length === 0 ? (
                <p className="empty">
                  Aucun utilisateur à afficher pour le moment.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Sessions</th>
                        <th>Terminées</th>
                        <th>Moyenne</th>
                        <th>Communication</th>
                        <th>Confiance</th>
                        <th>Clarté</th>
                        <th>Pertinence</th>
                        <th>Professionnalisme</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.user_id}>
                          <td>{u.full_name || "Sans nom"}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className="role">{u.role}</span>
                          </td>
                          <td>{u.sessions_count ?? 0}</td>
                          <td>{u.completed_sessions_count ?? 0}</td>
                          <td>{formatScore(u.average_score)}</td>
                          <td>{formatScore(u.communication_average)}</td>
                          <td>{formatScore(u.confidence_average)}</td>
                          <td>{formatScore(u.clarity_average)}</td>
                          <td>{formatScore(u.relevance_average)}</td>
                          <td>{formatScore(u.professionalism_average)}</td>
                          <td>
                            <button
                              type="button"
                              className={`btn btn-primary small ${
                                selectedUserId === u.user_id ? "active" : ""
                              }`}
                              onClick={() => handleViewEvolution(u.user_id)}
                            >
                              Voir évolution
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="card detail">
              <h2>Évolution utilisateur</h2>
              {!selectedUserId && !progressLoading && (
                <p className="empty">
                  Sélectionnez un utilisateur pour afficher sa progression.
                </p>
              )}

              {progressLoading && (
                <p className="empty">Chargement de la progression...</p>
              )}

              {progressError && <Alert type="error">{progressError}</Alert>}

              {progress && (
                <>
                  <div className="meta">
                    <strong>{progress.user?.full_name || "Sans nom"}</strong>
                    <span>{progress.user?.email}</span>
                    <span>Rôle: {progress.user?.role || "N/A"}</span>
                  </div>

                  <div className="summary-grid">
                    <article>
                      <span>Premier score</span>
                      <strong>
                        {firstScore !== null ? formatScore(firstScore) : "N/A"}
                      </strong>
                    </article>
                    <article>
                      <span>Dernier score</span>
                      <strong>
                        {latestScore !== null ? formatScore(latestScore) : "N/A"}
                      </strong>
                    </article>
                    <article>
                      <span>Amélioration</span>
                      <strong>
                        {improvement !== null ? `${improvement} pts` : "N/A"}
                      </strong>
                    </article>
                    <article>
                      <span>Meilleur score</span>
                      <strong>{formatScore(progress.summary?.best_score)}</strong>
                    </article>
                  </div>

                  <p className="insight">{insight}</p>

                  <section className="chart-block">
                    <h3>Courbe d’évolution</h3>
                    {evolutionPoints.length <= 1 ? (
                      <p className="empty">
                        Pas assez de sessions notées pour tracer une courbe.
                      </p>
                    ) : (
                      <svg viewBox="0 0 380 200" role="img">
                        <line x1="30" y1="170" x2="350" y2="170" />
                        <line x1="30" y1="30" x2="30" y2="170" />
                        <polyline points={evolutionPolyline} />
                        {evolutionPoints.map((point, idx) => {
                          const x =
                            evolutionPoints.length === 1
                              ? 30
                              : 30 + (idx / (evolutionPoints.length - 1)) * 320;
                          const y =
                            170 - Math.max(0, Math.min(10, point.score)) * 14;
                          return <circle key={`pt-${idx}`} cx={x} cy={y} r="4" />;
                        })}
                      </svg>
                    )}
                  </section>

                  <section className="chart-block">
                    <h3>Évaluation par compétence</h3>
                    {[
                      ["Communication", progress.skill_averages?.communication],
                      ["Confiance", progress.skill_averages?.confidence],
                      ["Clarté", progress.skill_averages?.clarity],
                      ["Pertinence", progress.skill_averages?.relevance],
                      [
                        "Professionnalisme",
                        progress.skill_averages?.professionalism,
                      ],
                    ].map(([label, value]) => (
                      <div className="bar-row" key={label}>
                        <div className="bar-head">
                          <span>{label}</span>
                          <strong>{formatScore(value)}</strong>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${toPercent(value)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </section>

                  <section className="chart-block">
                    <h3>Sessions et scores</h3>
                    {!Array.isArray(progress.progression) ||
                    progress.progression.length === 0 ? (
                      <p className="empty">
                        Aucun feedback disponible pour cet utilisateur.
                      </p>
                    ) : (
                      <div className="sessions-list">
                        {progress.progression.map((item) => (
                          <article key={item.session_id} className="session-card">
                            <header>
                              <strong>{item.scenario_title || "Scénario"}</strong>
                              <span>{formatDate(item.completed_at)}</span>
                            </header>
                            <div className="scores">
                              <span>
                                Score global: {formatScore(item.overall_score)}
                              </span>
                              <span>
                                Communication:{" "}
                                {formatScore(item.communication_score)}
                              </span>
                              <span>
                                Confiance: {formatScore(item.confidence_score)}
                              </span>
                              <span>Clarté: {formatScore(item.clarity_score)}</span>
                              <span>
                                Pertinence: {formatScore(item.relevance_score)}
                              </span>
                              <span>
                                Professionnalisme:{" "}
                                {formatScore(item.professionalism_score)}
                              </span>
                            </div>
                            <div className="sentiment-row">
                              <span
                                className={`sentiment ${sentimentTone(
                                  item.voice_sentiment_label
                                )}`}
                              >
                                Sentiment: {sentimentLabel(item.voice_sentiment_label)}
                              </span>
                              <span>
                                Score sentiment:{" "}
                                {Number.isFinite(Number(item.voice_sentiment_score))
                                  ? Number(item.voice_sentiment_score).toFixed(2)
                                  : "N/A"}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </aside>
          </section>
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          padding: 28px 18px 48px;
          background:
            radial-gradient(
              circle at 12% 0%,
              rgba(14, 165, 233, 0.2),
              transparent 34%
            ),
            radial-gradient(
              circle at 88% 18%,
              rgba(59, 130, 246, 0.2),
              transparent 38%
            ),
            #020817;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          color: #dbeafe;
        }

        .card {
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: linear-gradient(
            145deg,
            rgba(15, 23, 42, 0.88),
            rgba(30, 41, 59, 0.72)
          );
          box-shadow: 0 20px 44px rgba(2, 6, 23, 0.35);
          backdrop-filter: blur(18px);
        }

        .hero {
          padding: 24px;
          margin-bottom: 16px;
          display: flex;
          gap: 16px;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .eyebrow {
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: #67e8f9;
          font-size: 13px;
        }

        h1 {
          margin: 10px 0;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.15;
          color: #f8fafc;
        }

        h2 {
          margin: 0 0 12px;
          font-size: 24px;
          color: #f8fafc;
        }

        h3 {
          margin: 0 0 12px;
          font-size: 18px;
          color: #e2e8f0;
        }

        p {
          margin: 0;
          font-size: 15px;
          line-height: 1.7;
          color: #cbd5e1;
        }

        .btn {
          appearance: none;
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #f8fafc;
        }

        .btn:focus-visible {
          outline: 3px solid rgba(34, 211, 238, 0.5);
          outline-offset: 2px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #0284c7);
          box-shadow: 0 12px 28px rgba(2, 132, 199, 0.35);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(2, 132, 199, 0.45);
        }

        .btn-primary.active {
          border-color: rgba(103, 232, 249, 0.8);
        }

        .btn-glass {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.4);
        }

        .btn-glass:hover {
          border-color: rgba(34, 211, 238, 0.75);
          box-shadow: 0 0 28px rgba(34, 211, 238, 0.25);
        }

        .small {
          padding: 8px 12px;
          font-size: 14px;
        }

        .controls {
          padding: 16px;
          display: flex;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .controls label {
          display: block;
          font-size: 13px;
          color: #93c5fd;
          margin-bottom: 6px;
          font-weight: 700;
        }

        select {
          appearance: none;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          background: rgba(15, 23, 42, 0.8);
          color: #e2e8f0;
          font-size: 14px;
          padding: 10px 12px;
          min-width: 220px;
        }

        .layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 16px;
          align-items: start;
        }

        .table-card {
          padding: 0;
          overflow: hidden;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 1200px;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 12px 10px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
          text-align: left;
          font-size: 14px;
          line-height: 1.6;
          white-space: nowrap;
        }

        th {
          font-size: 13px;
          color: #93c5fd;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        td {
          color: #e2e8f0;
        }

        .role {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(30, 64, 175, 0.3);
          border: 1px solid rgba(96, 165, 250, 0.5);
          font-size: 12px;
          color: #bfdbfe;
          font-weight: 700;
        }

        .detail {
          padding: 18px;
          position: sticky;
          top: 90px;
        }

        .meta {
          display: grid;
          gap: 4px;
          margin-bottom: 12px;
        }

        .meta strong {
          color: #f8fafc;
          font-size: 18px;
        }

        .meta span {
          color: #cbd5e1;
          font-size: 14px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }

        .summary-grid article {
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 14px;
          padding: 10px;
          background: rgba(15, 23, 42, 0.5);
        }

        .summary-grid span {
          display: block;
          font-size: 12px;
          color: #93c5fd;
          margin-bottom: 6px;
        }

        .summary-grid strong {
          font-size: 15px;
          color: #f8fafc;
        }

        .insight {
          padding: 9px 12px;
          border-radius: 10px;
          background: rgba(6, 182, 212, 0.15);
          border: 1px solid rgba(103, 232, 249, 0.4);
          color: #cffafe;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .chart-block {
          margin-bottom: 16px;
        }

        svg {
          width: 100%;
          height: 200px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(2, 6, 23, 0.5);
        }

        svg line {
          stroke: rgba(148, 163, 184, 0.45);
          stroke-width: 1;
        }

        svg polyline {
          fill: none;
          stroke: #22d3ee;
          stroke-width: 3;
        }

        svg circle {
          fill: #38bdf8;
        }

        .bar-row {
          margin-bottom: 10px;
        }

        .bar-head {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 13px;
          color: #e2e8f0;
          margin-bottom: 6px;
        }

        .bar-track {
          height: 9px;
          border-radius: 999px;
          background: rgba(30, 41, 59, 0.85);
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0ea5e9, #22d3ee);
        }

        .sessions-list {
          display: grid;
          gap: 10px;
          max-height: 380px;
          overflow: auto;
          padding-right: 2px;
        }

        .session-card {
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 14px;
          padding: 12px;
          background: rgba(15, 23, 42, 0.5);
        }

        .session-card header {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .session-card strong {
          color: #f8fafc;
          font-size: 15px;
        }

        .session-card header span {
          color: #93c5fd;
          font-size: 12px;
        }

        .scores {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }

        .scores span {
          font-size: 12px;
          color: #cbd5e1;
        }

        .sentiment-row {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #cbd5e1;
        }

        .sentiment {
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .sentiment.positive {
          color: #86efac;
          border-color: rgba(34, 197, 94, 0.45);
          background: rgba(22, 163, 74, 0.15);
        }

        .sentiment.negative {
          color: #fda4af;
          border-color: rgba(244, 63, 94, 0.4);
          background: rgba(190, 24, 93, 0.15);
        }

        .sentiment.neutral {
          color: #7dd3fc;
          border-color: rgba(14, 165, 233, 0.45);
          background: rgba(14, 165, 233, 0.15);
        }

        .sentiment.empty {
          color: #cbd5e1;
          border-color: rgba(148, 163, 184, 0.4);
          background: rgba(51, 65, 85, 0.35);
        }

        .empty {
          color: #94a3b8;
          font-size: 15px;
          line-height: 1.7;
        }

        @media (max-width: 1200px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .detail {
            position: static;
          }
        }

        @media (max-width: 700px) {
          .page-shell {
            padding: 20px 12px 34px;
          }

          .hero {
            padding: 18px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .scores {
            grid-template-columns: 1fr;
          }

          select {
            min-width: 180px;
          }
        }
      `}</style>
    </>
  );
}