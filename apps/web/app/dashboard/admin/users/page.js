\"use client\";

import { useEffect, useMemo, useState } from \"react\";
import { useRouter } from \"next/navigation\";
import Navbar from \"../../../components/Navbar\";
import Alert from \"../../../components/ui/Alert\";
import { getAdminAnalyticsUsers, getAdminUserProgress, getMe } from \"../../../lib/api\";

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(\"\");

  const [sortBy, setSortBy] = useState(\"average_score\");
  const [order, setOrder] = useState(\"desc\");

  const [accessDenied, setAccessDenied] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(\"\");
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(\"\");

  useEffect(() => {
    async function loadPage() {
      try {
        const token = localStorage.getItem(\"token\");

        if (!token) {
          router.replace(\"/auth/login\");
          return;
        }

        setLoading(true);
        setError(\"\");
        setAccessDenied(false);

        const me = await getMe(token);
        if (!me || me.role !== \"admin\") {
          setAccessDenied(true);
          return;
        }

        const usersData = await getAdminAnalyticsUsers(token, sortBy, order);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        const msg = err?.message || \"Impossible de charger la page utilisateurs.\";
        setError(msg);
        if (String(msg).toLowerCase().includes(\"accès refusé\")) {
          setAccessDenied(true);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [router, sortBy, order]);

  const progressPoints = useMemo(() => {
    const items = progress?.progression;
    if (!Array.isArray(items)) return [];
    return items
      .map((it, idx) => ({
        idx,
        score: Number(it?.overall_score),
        session_id: it?.session_id,
      }))
      .filter((p) => Number.isFinite(p.score));
  }, [progress]);

  function fmtScore(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return \"N/A\";
    return num.toFixed(1);
  }

  function pctFrom10(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, num * 10));
  }

  function formatDate(value) {
    if (!value) return \"Non disponible\";
    try {
      return new Intl.DateTimeFormat(\"fr-FR\", {\n        dateStyle: \"medium\",\n        timeStyle: \"short\",\n      }).format(new Date(value));\n    } catch {\n      return \"Date invalide\";\n    }
  }

  function sentimentLabel(value) {
    const normalized = String(value || \"\").toLowerCase();
    if (normalized === \"positive\") return \"Positif\";
    if (normalized === \"negative\") return \"Négatif\";
    if (normalized === \"neutral\") return \"Neutre\";
    return value || \"Non disponible\";
  }

  function sentimentClass(value) {
    const normalized = String(value || \"\").toLowerCase();
    if (normalized === \"positive\") return \"positive\";
    if (normalized === \"negative\") return \"negative\";
    if (normalized === \"neutral\") return \"neutral\";
    return \"empty\";
  }

  async function handleViewEvolution(userId) {
    try {
      const token = localStorage.getItem(\"token\");
      if (!token) {
        router.replace(\"/auth/login\");
        return;
      }

      setSelectedUserId(userId);
      setProgress(null);
      setProgressError(\"\");
      setProgressLoading(true);

      const data = await getAdminUserProgress(token, userId);
      setProgress(data || null);
    } catch (err) {
      setProgressError(err?.message || \"Impossible de charger l’évolution.\");
    } finally {
      setProgressLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <Card style={{ padding: "28px", borderRadius: "28px" }}>
              <p className="eyebrow">Admin</p>
              <h1 className="hero-title">Chargement des utilisateurs...</h1>
              <p className="hero-text">
                Nous préparons la vue d’administration des utilisateurs.
              </p>
            </Card>
          </div>
        </main>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            background: linear-gradient(
              180deg,
              #f8fbff 0%,
              #eef4ff 45%,
              #ffffff 100%
            );
            padding: 32px 20px 60px;
          }

          .page-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .eyebrow {
            margin: 0;
            color: #2563eb;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .hero-title {
            margin: 12px 0 10px;
            color: #0f172a;
            font-size: clamp(30px, 4vw, 46px);
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -0.04em;
          }

          .hero-text {
            margin: 0;
            color: #64748b;
            font-size: 16px;
            line-height: 1.8;
            font-weight: 500;
            max-width: 700px;
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

          {info && (
            <Alert
              type="info"
              style={{ marginBottom: "18px", borderRadius: "18px" }}
            >
              {info}
            </Alert>
          )}

          <Card
            style={{
              padding: "32px",
              borderRadius: "30px",
              background:
                "linear-gradient(135deg, #ffffff, #eff6ff 50%, #dbeafe)",
              border: "1px solid #dbeafe",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
              marginBottom: "24px",
            }}
          >
            <div className="hero-row">
              <div className="hero-main">
                <p className="eyebrow">Admin utilisateurs</p>
                <h1 className="hero-title">Gestion des utilisateurs</h1>
                <p className="hero-text">
                  Consulte les comptes présents dans la plateforme et prépare la
                  future gestion des rôles et accès.
                </p>
                {user?.email && (
                  <p className="admin-email">Connecté avec : {user.email}</p>
                )}
              </div>

              <div className="hero-actions">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard/admin")}
                >
                  Retour dashboard admin
                </Button>
              </div>
            </div>
          </Card>

          <section>
            <SectionHeader
              eyebrow="Administration"
              title="Liste des utilisateurs"
              description="Vue admin des comptes disponibles dans Street University."
            />

            {users.length === 0 ? (
              <Card style={{ padding: "22px", borderRadius: "22px" }}>
                <p className="card-text">
                  Aucun utilisateur disponible pour le moment.
                </p>
              </Card>
            ) : (
              <div className="table-wrap">
                <Card style={{ padding: "0", borderRadius: "24px", overflow: "hidden" }}>
                  <div className="users-table">
                    <div className="table-head row">
                      <div>Nom</div>
                      <div>Email</div>
                      <div>Rôle</div>
                      <div>Créé le</div>
                      <div>Actions</div>
                    </div>

                    {users.map((item) => (
                      <div key={item.id} className="row">
                        <div data-label="Nom">
                          {item.full_name || "Sans nom"}
                        </div>
                        <div data-label="Email">{item.email}</div>
                        <div data-label="Rôle">
                          <span
                            className={`role-badge ${
                              item.role === "admin"
                                ? "admin"
                                : item.role === "mentor"
                                ? "mentor"
                                : "student"
                            }`}
                          >
                            {item.role}
                          </span>
                        </div>
                        <div data-label="Créé le">{item.created_at}</div>
                        <div data-label="Actions" className="actions-cell">
                          <Button variant="secondary" onClick={() => {}}>
                            Rôle bientôt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </section>
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background: linear-gradient(
            180deg,
            #f8fbff 0%,
            #eef4ff 45%,
            #ffffff 100%
          );
          padding: 32px 20px 60px;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-main {
          max-width: 760px;
          min-width: 0;
          flex: 1;
        }

        .eyebrow {
          margin: 0;
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 12px 0 10px;
          color: #0f172a;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .hero-text {
          margin: 0;
          color: #334155;
          font-size: 16px;
          line-height: 1.8;
          font-weight: 500;
          max-width: 700px;
        }

        .admin-email {
          margin: 14px 0 0;
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          word-break: break-word;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .table-wrap {
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
        }

        .row {
          display: grid;
          grid-template-columns: 1.1fr 1.4fr 0.8fr 0.9fr 1fr;
          gap: 14px;
          padding: 18px 20px;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
        }

        .row:last-child {
          border-bottom: none;
        }

        .table-head {
          background: #f8fafc;
          font-weight: 800;
          color: #0f172a;
        }

        .row:not(.table-head) {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
        }

        .role-badge.admin {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        .role-badge.mentor {
          background: #ecfdf5;
          color: #15803d;
          border-color: #bbf7d0;
        }

        .role-badge.student {
          background: #f8fafc;
          color: #334155;
          border-color: #cbd5e1;
        }

        .actions-cell {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .card-text {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 500;
        }

        @media (max-width: 900px) {
          .page-shell {
            padding: 28px 18px 48px;
          }

          .hero-row {
            flex-direction: column;
            align-items: stretch;
          }

          .hero-actions {
            width: 100%;
          }

          .row {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .table-head {
            display: none;
          }

          .row:not(.table-head) > div::before {
            content: attr(data-label);
            display: block;
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
        }

        @media (max-width: 640px) {
          .page-shell {
            padding: 20px 12px 36px;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-text {
            font-size: 15px;
            line-height: 1.7;
          }

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </>
  );
}