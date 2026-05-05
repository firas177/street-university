"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Alert from "../../components/ui/Alert";
import {
  askAdminAssistant,
  getAdminAnalyticsSummary,
  getAdminAnalyticsUsers,
  getMe,
} from "../../lib/api";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);

  const [sortBy, setSortBy] = useState("average_score");
  const [order, setOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState(null);

  useEffect(() => {
    async function loadAdminDashboard() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/auth/login");
          return;
        }

        setLoading(true);
        setUsersLoading(true);
        setError("");
        setAccessDenied(false);

        const meData = await getMe(token);
        setMe(meData || null);

        if (!meData || meData.role !== "admin") {
          setAccessDenied(true);
          return;
        }

        const [summaryData, usersData] = await Promise.all([
          getAdminAnalyticsSummary(token),
          getAdminAnalyticsUsers(token, sortBy, order),
        ]);

        setSummary(summaryData || null);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        const msg = err?.message || "Impossible de charger le dashboard admin.";
        setError(msg);
        if (String(msg).toLowerCase().includes("accès refusé")) {
          setAccessDenied(true);
        }
      } finally {
        setLoading(false);
        setUsersLoading(false);
      }
    }

    loadAdminDashboard();
  }, [router, sortBy, order]);

  useEffect(() => {
    async function reloadUsers() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        if (!me || me.role !== "admin") return;

        setUsersLoading(true);
        const usersData = await getAdminAnalyticsUsers(token, sortBy, order);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        setError(err?.message || "Impossible de recharger la liste utilisateurs.");
      } finally {
        setUsersLoading(false);
      }
    }

    reloadUsers();
  }, [me, sortBy, order]);

  const avgSkill = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return null;

    const pickAvg = (key) => {
      const values = users
        .map((u) => Number(u?.[key]))
        .filter((v) => Number.isFinite(v));
      if (values.length === 0) return null;
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    };

    return {
      communication: pickAvg("communication_average"),
      confidence: pickAvg("confidence_average"),
      clarity: pickAvg("clarity_average"),
      relevance: pickAvg("relevance_average"),
      professionalism: pickAvg("professionalism_average"),
    };
  }, [users]);

  const top5ByAverage = useMemo(() => {
    const list = Array.isArray(users) ? [...users] : [];
    return list
      .filter((u) => Number.isFinite(Number(u?.average_score)))
      .sort((a, b) => Number(b.average_score) - Number(a.average_score))
      .slice(0, 5);
  }, [users]);

  function fmtScore(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "N/A";
    return num.toFixed(1);
  }

  function pctFrom10(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, num * 10));
  }

  function bestLabel(obj) {
    if (!obj) return "—";
    return obj.full_name || obj.email || "—";
  }

  async function handleAskAssistant(message) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setAssistantLoading(true);
      setAssistantError("");
      setAssistantAnswer(null);

      const res = await askAdminAssistant(token, message);
      setAssistantAnswer(res || null);
    } catch (err) {
      const msg = err?.message || "Impossible d'interroger l'assistant admin.";
      setAssistantError(msg);
    } finally {
      setAssistantLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell loading">
          <section className="loading-card">
            <div className="loading-orbit" aria-hidden>
              <span />
            </div>
            <p className="eyebrow">Admin</p>
            <h1>Chargement du centre de contrôle</h1>
            <p>Nous synchronisons les métriques utilisateurs et sessions.</p>
          </section>
        </main>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            background:
              radial-gradient(circle at 8% 0%, rgba(59, 130, 246, 0.36), transparent 30%),
              radial-gradient(circle at 92% 12%, rgba(124, 58, 237, 0.28), transparent 28%),
              linear-gradient(180deg, #030712 0%, #0f172a 58%, #e8eefc 100%);
            padding: 28px 20px 70px;
            color: #f8fafc;
            overflow: hidden;
          }

          .page-shell.loading {
            display: grid;
            place-items: center;
          }

          .loading-card {
            width: min(760px, 100%);
            border: 1px solid rgba(147, 197, 253, 0.22);
            border-radius: 34px;
            background: rgba(255, 255, 255, 0.12);
            padding: 40px;
            box-shadow: 0 30px 90px rgba(2, 6, 23, 0.32);
            backdrop-filter: blur(22px);
          }

          .loading-orbit {
            width: 64px;
            height: 64px;
            border: 1px solid rgba(255, 255, 255, 0.24);
            border-radius: 24px;
            display: grid;
            place-items: center;
            margin-bottom: 22px;
            background: rgba(255, 255, 255, 0.1);
          }

          .loading-orbit span {
            width: 30px;
            height: 30px;
            border: 4px solid rgba(191, 219, 254, 0.55);
            border-top-color: #ffffff;
            border-radius: 999px;
            animation: spin 0.8s linear infinite;
          }

          .eyebrow {
            margin: 0 0 12px;
            color: #bfdbfe;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            font-size: clamp(32px, 5vw, 56px);
            line-height: 1;
            font-weight: 900;
          }

          p {
            margin: 16px 0 0;
            color: #dbeafe;
            font-size: 16px;
            line-height: 1.75;
            max-width: 620px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
    );
  }

  if (accessDenied) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <div className="denied-card">
              <p className="eyebrow">Accès</p>
              <h1>Accès réservé aux administrateurs.</h1>
              <p>
                Vous n’avez pas les droits nécessaires pour consulter les
                analytics admin.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => router.push("/dashboard")}
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </main>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            background:
              radial-gradient(circle at 8% 0%, rgba(59, 130, 246, 0.36), transparent 30%),
              radial-gradient(circle at 92% 12%, rgba(124, 58, 237, 0.28), transparent 28%),
              linear-gradient(180deg, #030712 0%, #0f172a 58%, #e8eefc 100%);
            padding: 28px 20px 70px;
            color: #f8fafc;
          }

          .page-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .denied-card {
            width: min(760px, 100%);
            margin: 0 auto;
            border: 1px solid rgba(147, 197, 253, 0.22);
            border-radius: 34px;
            background: rgba(255, 255, 255, 0.12);
            padding: 40px;
            box-shadow: 0 30px 90px rgba(2, 6, 23, 0.32);
            backdrop-filter: blur(22px);
          }

          .eyebrow {
            margin: 0 0 12px;
            color: #bfdbfe;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            font-size: clamp(30px, 4vw, 52px);
            line-height: 1.05;
            font-weight: 950;
          }

          p {
            margin: 16px 0 0;
            color: #dbeafe;
            font-size: 16px;
            line-height: 1.75;
          }

          .btn {
            appearance: none;
            font-family: inherit;
            cursor: pointer;
            border-radius: 999px;
            font-size: 16px;
            font-weight: 900;
            min-height: 52px;
            padding: 14px 24px;
            border: 1px solid transparent;
            transition: transform 0.18s ease, box-shadow 0.22s ease;
            margin-top: 22px;
          }

          .btn:focus-visible {
            outline: 2px solid #38bdf8;
            outline-offset: 3px;
          }

          .btn:hover {
            transform: translateY(-2px);
          }

          .btn-primary {
            background: linear-gradient(135deg, #ffffff 0%, #bfdbfe 45%, #22d3ee 100%);
            color: #0f172a;
            box-shadow: 0 20px 50px rgba(37, 99, 235, 0.35);
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
            <Alert
              type="error"
              style={{ marginBottom: "18px", borderRadius: "18px" }}
            >
              {error}
            </Alert>
          )}

          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Centre de contrôle admin</p>
              <h1>Centre de contrôle admin</h1>
              <p className="lead">
                Analysez les utilisateurs, les sessions, les performances et
                interrogez l’assistant admin.
              </p>
              {me?.email && (
                <p className="muted">Connecté avec : {me.email}</p>
              )}
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => router.push("/dashboard/admin/scenarios")}
                >
                  Gérer les scénarios
                </button>
                <button
                  type="button"
                  className="btn btn-glass"
                  onClick={() => router.push("/dashboard/admin/users")}
                >
                  Analyse utilisateurs
                </button>
              </div>
            </div>

            <aside className="hero-panel">
              <p className="panel-eyebrow">Résumé</p>
              <div className="panel-grid">
                <div>
                  <strong>{summary?.total_users ?? 0}</strong>
                  <span>utilisateurs</span>
                </div>
                <div>
                  <strong>{summary?.total_sessions ?? 0}</strong>
                  <span>sessions</span>
                </div>
                <div>
                  <strong>{summary?.completed_sessions ?? 0}</strong>
                  <span>terminées</span>
                </div>
                <div>
                  <strong>{summary?.active_sessions ?? 0}</strong>
                  <span>actives</span>
                </div>
              </div>
              <div className="panel-score">
                <span>Score moyen global</span>
                <strong>
                  {summary?.average_score !== null &&
                  summary?.average_score !== undefined
                    ? `${Number(summary.average_score).toFixed(1)} / 10`
                    : "N/A"}
                </strong>
              </div>
            </aside>
          </section>

          <section className="section">
            <header className="section-head">
              <p className="section-eyebrow">Synthèse</p>
              <h2>Indicateurs clés</h2>
            </header>

            <div className="summary-grid">
              <article className="summary-card">
                <span>Utilisateurs</span>
                <strong>{summary?.total_users ?? 0}</strong>
                <p>Nombre total d’inscriptions.</p>
              </article>
              <article className="summary-card">
                <span>Sessions totales</span>
                <strong>{summary?.total_sessions ?? 0}</strong>
                <p>Toutes les simulations enregistrées.</p>
              </article>
              <article className="summary-card">
                <span>Sessions terminées</span>
                <strong>{summary?.completed_sessions ?? 0}</strong>
                <p>Sessions clôturées.</p>
              </article>
              <article className="summary-card">
                <span>Sessions actives</span>
                <strong>{summary?.active_sessions ?? 0}</strong>
                <p>Sessions en cours.</p>
              </article>
              <article className="summary-card summary-card-wide">
                <span>Score moyen global</span>
                <strong>
                  {summary?.average_score !== null &&
                  summary?.average_score !== undefined
                    ? `${Number(summary.average_score).toFixed(1)} / 10`
                    : "N/A"}
                </strong>
                <p>Moyenne des scores globaux des feedbacks.</p>
              </article>
            </div>
          </section>

          <section className="section">
            <header className="section-head">
              <p className="section-eyebrow">Classements</p>
              <h2>Meilleurs utilisateurs</h2>
            </header>

            <div className="best-grid">
              <article className="best-card">
                <span>Meilleure moyenne</span>
                <strong>{bestLabel(summary?.best_overall_user)}</strong>
                <p>Score : {fmtScore(summary?.best_overall_user?.score)}</p>
              </article>
              <article className="best-card">
                <span>Meilleure communication</span>
                <strong>{bestLabel(summary?.best_communication_user)}</strong>
                <p>Score : {fmtScore(summary?.best_communication_user?.score)}</p>
              </article>
              <article className="best-card">
                <span>Meilleure confiance</span>
                <strong>{bestLabel(summary?.best_confidence_user)}</strong>
                <p>Score : {fmtScore(summary?.best_confidence_user?.score)}</p>
              </article>
              <article className="best-card">
                <span>Meilleur professionnalisme</span>
                <strong>{bestLabel(summary?.best_professionalism_user)}</strong>
                <p>Score : {fmtScore(summary?.best_professionalism_user?.score)}</p>
              </article>
            </div>
          </section>

          <section className="section">
            <header className="section-head section-head-row">
              <div>
                <p className="section-eyebrow">Analytics utilisateurs</p>
                <h2>Tableau des utilisateurs</h2>
                <p className="lead">
                  Tri contrôlé côté serveur (ORM). Aucun SQL arbitraire.
                </p>
              </div>

              <div className="sort-controls" aria-label="Tri utilisateurs">
                <label>
                  <span>Trier par</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="average_score">Moyenne</option>
                    <option value="communication_average">Communication</option>
                    <option value="confidence_average">Confiance</option>
                    <option value="clarity_average">Clarté</option>
                    <option value="relevance_average">Pertinence</option>
                    <option value="professionalism_average">Professionnalisme</option>
                    <option value="sessions_count">Sessions</option>
                    <option value="completed_sessions_count">Terminées</option>
                    <option value="created_at">Date d’inscription</option>
                  </select>
                </label>

                <label>
                  <span>Ordre</span>
                  <select
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </label>
              </div>
            </header>

            <div className="table-card">
              {usersLoading ? (
                <div className="mini-loading">Chargement des utilisateurs…</div>
              ) : users.length === 0 ? (
                <div className="empty-state">
                  Aucun utilisateur trouvé. Ajoutez des comptes pour voir les analytics.
                </div>
              ) : (
                <div className="table-wrap" role="region" aria-label="Tableau utilisateurs">
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
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.user_id}>
                          <td>
                            <div className="user-cell">
                              <span className="avatar">
                                {(u.full_name || u.email || "?").trim().slice(0, 2).toUpperCase()}
                              </span>
                              <span className="user-name">{u.full_name || "—"}</span>
                            </div>
                          </td>
                          <td className="mono">{u.email}</td>
                          <td>
                            <span className={`role-pill ${u.role || "user"}`}>
                              {u.role || "user"}
                            </span>
                          </td>
                          <td>{u.sessions_count ?? 0}</td>
                          <td>{u.completed_sessions_count ?? 0}</td>
                          <td>{fmtScore(u.average_score)}</td>
                          <td>{fmtScore(u.communication_average)}</td>
                          <td>{fmtScore(u.confidence_average)}</td>
                          <td>{fmtScore(u.clarity_average)}</td>
                          <td>{fmtScore(u.relevance_average)}</td>
                          <td>{fmtScore(u.professionalism_average)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="section">
            <header className="section-head">
              <p className="section-eyebrow">Visual analytics</p>
              <h2>Lecture visuelle rapide</h2>
            </header>

            <div className="charts-grid">
              <article className="chart-card">
                <h3>Moyenne des compétences</h3>
                <p className="muted">Barres CSS basées sur les moyennes utilisateurs.</p>
                {avgSkill ? (
                  <div className="bars">
                    {[
                      ["Communication", avgSkill.communication],
                      ["Confiance", avgSkill.confidence],
                      ["Clarté", avgSkill.clarity],
                      ["Pertinence", avgSkill.relevance],
                      ["Professionnalisme", avgSkill.professionalism],
                    ].map(([label, v]) => (
                      <div className="bar-row" key={label}>
                        <div className="bar-copy">
                          <strong>{label}</strong>
                          <span>{fmtScore(v)} / 10</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${pctFrom10(v)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">Aucune donnée de score pour le moment.</div>
                )}
              </article>

              <article className="chart-card">
                <h3>Top 5 utilisateurs (moyenne)</h3>
                <p className="muted">Classement calculé côté client.</p>
                {top5ByAverage.length === 0 ? (
                  <div className="empty-state">Aucune moyenne disponible pour afficher un top 5.</div>
                ) : (
                  <div className="bars">
                    {top5ByAverage.map((u, idx) => (
                      <div className="bar-row" key={u.user_id}>
                        <div className="bar-copy">
                          <strong>{idx + 1}. {u.full_name || u.email}</strong>
                          <span>{fmtScore(u.average_score)} / 10</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill alt" style={{ width: `${pctFrom10(u.average_score)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="chart-card">
                <h3>Sessions terminées vs actives</h3>
                <p className="muted">Vue simple pour la démo jury.</p>
                <div className="two-metrics">
                  <div className="metric-box">
                    <span>Terminées</span>
                    <strong>{summary?.completed_sessions ?? 0}</strong>
                  </div>
                  <div className="metric-box">
                    <span>Actives</span>
                    <strong>{summary?.active_sessions ?? 0}</strong>
                  </div>
                </div>
                <div className="stack-track" aria-label="Répartition sessions">
                  {(() => {
                    const done = Number(summary?.completed_sessions || 0);
                    const active = Number(summary?.active_sessions || 0);
                    const total = Math.max(1, done + active);
                    const donePct = Math.round((done / total) * 100);
                    const activePct = 100 - donePct;
                    return (
                      <div className="stack">
                        <div className="stack-done" style={{ width: `${donePct}%` }} />
                        <div className="stack-active" style={{ width: `${activePct}%` }} />
                      </div>
                    );
                  })()}
                </div>
              </article>
            </div>
          </section>

          <section className="section">
            <header className="section-head">
              <p className="section-eyebrow">Assistant</p>
              <h2>Assistant admin</h2>
              <p className="lead">
                Chatbot contrôlé : détection d’intentions + requêtes ORM, sans SQL libre.
              </p>
            </header>

            <div className="assistant-grid">
              <article className="assistant-card">
                <div className="assistant-top">
                  <input
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    placeholder="Posez une question admin…"
                    className="assistant-input"
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-compact"
                    disabled={assistantLoading || !assistantInput.trim()}
                    onClick={() => handleAskAssistant(assistantInput.trim())}
                  >
                    {assistantLoading ? "Analyse…" : "Envoyer"}
                  </button>
                </div>

                <div className="assistant-examples" aria-label="Exemples">
                  {[
                    "Qui a la meilleure moyenne ?",
                    "Qui a la meilleure communication ?",
                    "Combien de sessions terminées ?",
                    "Montre-moi les 5 meilleurs utilisateurs",
                    "Quel utilisateur a le plus de sessions ?",
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="btn btn-glass btn-chip"
                      onClick={() => {
                        setAssistantInput(q);
                        handleAskAssistant(q);
                      }}
                      disabled={assistantLoading}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {assistantError && <div className="assistant-error">{assistantError}</div>}

                {assistantAnswer && (
                  <div className="assistant-answer">
                    <div className="answer-head">
                      <span className="intent-pill">Intent : {assistantAnswer.intent || "—"}</span>
                    </div>
                    <p className="answer-text">{assistantAnswer.answer}</p>
                    {assistantAnswer.data && (
                      <details className="answer-data">
                        <summary>Voir les données</summary>
                        <pre>{JSON.stringify(assistantAnswer.data, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                )}
              </article>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 0%, rgba(59, 130, 246, 0.38), transparent 30%),
            radial-gradient(circle at 92% 12%, rgba(124, 58, 237, 0.28), transparent 28%),
            linear-gradient(180deg, #030712 0%, #0f172a 58%, #e8eefc 100%);
          padding: 32px 20px 74px;
          color: #f8fafc;
        }

        .page-container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .eyebrow,
        .section-eyebrow {
          margin: 0 0 10px;
          color: #93c5fd;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          line-height: 1.35;
        }

        h1 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(38px, 5vw, 58px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        h2 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.1;
          font-weight: 950;
        }

        h3 {
          margin: 0 0 12px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 950;
        }

        .lead {
          margin: 14px 0 0;
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.75;
          font-weight: 550;
          max-width: 860px;
        }

        .muted {
          margin: 12px 0 0;
          color: #c7d2fe;
          font-size: 15px;
          line-height: 1.65;
          word-break: break-word;
        }

        .btn {
          appearance: none;
          font-family: inherit;
          cursor: pointer;
          border-radius: 999px;
          font-size: 16px;
          font-weight: 900;
          min-height: 52px;
          padding: 14px 24px;
          border: 1px solid transparent;
          transition:
            transform 0.18s ease,
            box-shadow 0.22s ease,
            border-color 0.2s ease,
            background 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 10px;
        }

        .btn:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ffffff 0%, #bfdbfe 45%, #22d3ee 100%);
          color: #0f172a;
          box-shadow: 0 20px 50px rgba(37, 99, 235, 0.35);
        }

        .btn-glass {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(96, 165, 250, 0.1));
          color: #f8fafc;
          border-color: rgba(147, 197, 253, 0.35);
          backdrop-filter: blur(12px);
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.2);
        }

        .btn-glass:hover:not(:disabled) {
          border-color: rgba(34, 211, 238, 0.65);
        }

        .btn-compact {
          min-height: 48px;
          padding: 12px 18px;
          font-size: 15px;
        }

        .btn-chip {
          min-height: 44px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 850;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
          gap: 18px;
          border: 1px solid rgba(147, 197, 253, 0.24);
          border-radius: 34px;
          padding: 34px;
          background:
            radial-gradient(circle at 22% 12%, rgba(37, 99, 235, 0.38), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.62));
          box-shadow: 0 34px 100px rgba(2, 6, 23, 0.32);
          backdrop-filter: blur(20px);
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .hero-panel {
          border: 1px solid rgba(147, 197, 253, 0.22);
          border-radius: 28px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 70px rgba(2, 6, 23, 0.26);
          backdrop-filter: blur(16px);
        }

        .panel-eyebrow {
          margin: 0 0 14px;
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .panel-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .panel-grid strong {
          display: block;
          color: #ffffff;
          font-size: 30px;
          line-height: 1;
          font-weight: 950;
        }

        .panel-grid span {
          display: block;
          margin-top: 6px;
          color: #dbeafe;
          font-size: 15px;
          line-height: 1.4;
          font-weight: 700;
        }

        .panel-score {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(147, 197, 253, 0.18);
        }

        .panel-score span {
          display: block;
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .panel-score strong {
          display: block;
          margin-top: 10px;
          color: #ffffff;
          font-size: 26px;
          font-weight: 950;
        }

        .section {
          border: 1px solid rgba(147, 197, 253, 0.18);
          border-radius: 30px;
          padding: 26px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.84), rgba(30, 41, 59, 0.5)),
            rgba(255, 255, 255, 0.06);
          box-shadow: 0 28px 90px rgba(2, 6, 23, 0.28);
          backdrop-filter: blur(18px);
        }

        .section-head {
          margin-bottom: 18px;
        }

        .section-head-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .summary-card,
        .best-card,
        .table-card,
        .chart-card,
        .assistant-card {
          border: 1px solid rgba(147, 197, 253, 0.2);
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(96, 165, 250, 0.06)),
            rgba(15, 23, 42, 0.28);
          box-shadow:
            0 22px 70px rgba(2, 6, 23, 0.26),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }

        .summary-card {
          padding: 20px;
          min-height: 150px;
        }

        .summary-card-wide {
          grid-column: span 2;
        }

        .summary-card span {
          display: block;
          color: #93c5fd;
          font-size: 14px;
          font-weight: 900;
        }

        .summary-card strong {
          display: block;
          margin-top: 12px;
          color: #ffffff;
          font-size: 42px;
          line-height: 1;
          font-weight: 950;
        }

        .summary-card p {
          margin: 12px 0 0;
          color: #dbeafe;
          font-size: 15px;
          line-height: 1.7;
        }

        .best-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .best-card {
          padding: 20px;
        }

        .best-card span {
          color: #93c5fd;
          font-size: 14px;
          font-weight: 900;
        }

        .best-card strong {
          display: block;
          margin-top: 12px;
          font-size: 18px;
          font-weight: 950;
          color: #ffffff;
          word-break: break-word;
        }

        .best-card p {
          margin: 12px 0 0;
          color: #dbeafe;
          font-size: 15px;
          line-height: 1.7;
        }

        .sort-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .sort-controls label {
          display: grid;
          gap: 8px;
        }

        .sort-controls span {
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        select {
          appearance: none;
          font-family: inherit;
          min-height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(147, 197, 253, 0.28);
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 10px 14px;
          font-size: 15px;
          font-weight: 800;
        }

        .table-card {
          padding: 14px;
        }

        .mini-loading,
        .empty-state {
          padding: 18px;
          border-radius: 18px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background: rgba(15, 23, 42, 0.35);
          color: #dbeafe;
          font-size: 15px;
          line-height: 1.7;
        }

        .table-wrap {
          overflow: auto;
          border-radius: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1080px;
        }

        thead th {
          position: sticky;
          top: 0;
          background: rgba(2, 6, 23, 0.9);
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 12px 10px;
          border-bottom: 1px solid rgba(147, 197, 253, 0.18);
        }

        tbody td {
          padding: 12px 10px;
          border-bottom: 1px solid rgba(147, 197, 253, 0.12);
          color: #e0f2fe;
          font-size: 15px;
          line-height: 1.6;
          font-weight: 650;
          vertical-align: top;
        }

        tbody tr:hover td {
          background: rgba(96, 165, 250, 0.06);
        }

        .user-cell {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #2563eb, #22d3ee);
          color: #ffffff;
          font-size: 12px;
          font-weight: 950;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 900;
          color: #ffffff;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 14px;
        }

        .role-pill {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 900;
          border: 1px solid rgba(147, 197, 253, 0.25);
          background: rgba(96, 165, 250, 0.12);
          color: #dbeafe;
        }

        .role-pill.admin {
          background: rgba(34, 197, 94, 0.14);
          border-color: rgba(74, 222, 128, 0.25);
          color: #bbf7d0;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .chart-card {
          padding: 22px;
        }

        .bars {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .bar-row {
          display: grid;
          gap: 10px;
          padding: 12px;
          border-radius: 18px;
          border: 1px solid rgba(147, 197, 253, 0.16);
          background: rgba(15, 23, 42, 0.3);
        }

        .bar-copy {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }

        .bar-copy strong {
          color: #ffffff;
          font-size: 15px;
          font-weight: 950;
        }

        .bar-copy span {
          color: #bfdbfe;
          font-size: 14px;
          font-weight: 850;
        }

        .bar-track {
          height: 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #22d3ee, #16a34a);
        }

        .bar-fill.alt {
          background: linear-gradient(90deg, #7c3aed, #2563eb, #22d3ee);
        }

        .two-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }

        .metric-box {
          border-radius: 18px;
          padding: 16px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background: rgba(15, 23, 42, 0.3);
        }

        .metric-box span {
          color: #93c5fd;
          font-size: 13px;
          font-weight: 900;
        }

        .metric-box strong {
          display: block;
          margin-top: 10px;
          color: #ffffff;
          font-size: 34px;
          line-height: 1;
          font-weight: 950;
        }

        .stack-track {
          margin-top: 14px;
          border-radius: 999px;
          overflow: hidden;
          height: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.1);
        }

        .stack {
          display: flex;
          height: 100%;
        }

        .stack-done {
          background: linear-gradient(90deg, #16a34a, #22c55e);
        }

        .stack-active {
          background: linear-gradient(90deg, #2563eb, #22d3ee);
        }

        .assistant-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
        }

        .assistant-card {
          padding: 22px;
        }

        .assistant-top {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .assistant-input {
          width: 100%;
          min-height: 52px;
          border-radius: 18px;
          border: 1px solid rgba(147, 197, 253, 0.28);
          background: rgba(255, 255, 255, 0.96);
          color: #0f172a;
          padding: 14px 16px;
          font-size: 16px;
          line-height: 1.6;
          font-weight: 650;
        }

        .assistant-input:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .assistant-examples {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }

        .assistant-error {
          margin-top: 14px;
          border-radius: 18px;
          padding: 14px 16px;
          border: 1px solid rgba(252, 165, 165, 0.4);
          background: rgba(127, 29, 29, 0.4);
          color: #fecaca;
          font-size: 15px;
          line-height: 1.7;
        }

        .assistant-answer {
          margin-top: 16px;
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(147, 197, 253, 0.22);
          background: rgba(15, 23, 42, 0.35);
        }

        .answer-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .intent-pill {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid rgba(147, 197, 253, 0.22);
          background: rgba(96, 165, 250, 0.12);
          color: #dbeafe;
          font-size: 13px;
          font-weight: 900;
        }

        .answer-text {
          margin: 0;
          color: #e0f2fe;
          font-size: 16px;
          line-height: 1.75;
          font-weight: 600;
          white-space: pre-wrap;
        }

        .answer-data {
          margin-top: 12px;
          border-radius: 18px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background: rgba(2, 6, 23, 0.6);
          padding: 12px;
        }

        .answer-data summary {
          cursor: pointer;
          color: #bfdbfe;
          font-weight: 900;
          font-size: 14px;
        }

        .answer-data pre {
          margin: 12px 0 0;
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.6;
          overflow: auto;
          max-height: 340px;
        }

        @media (max-width: 1100px) {
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .best-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .page-shell {
            padding: 24px 16px 56px;
          }

          .hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .page-shell {
            padding: 18px 12px 46px;
          }

          .hero {
            padding: 22px;
            border-radius: 26px;
          }

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .btn {
            width: 100%;
          }

          .summary-grid,
          .best-grid,
          .charts-grid {
            grid-template-columns: 1fr;
          }

          .summary-card-wide {
            grid-column: auto;
          }

          .assistant-top {
            grid-template-columns: 1fr;
          }

          select {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}