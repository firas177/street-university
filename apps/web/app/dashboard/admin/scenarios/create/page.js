"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import Alert from "../../../../components/ui/Alert";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../../../../components/ui/SectionHeader";
import { createScenario, getMe } from "../../../../lib/api";

const initialForm = {
  title: "",
  description: "",
  category: "",
  difficulty: "beginner",
  system_prompt: "",
};

export default function AdminCreateScenarioPage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [user, setUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    async function checkAccess() {
      try {
        const me = await getMe(token);
        setUser(me || null);

        if (me?.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setPageLoading(false);
      } catch {
        router.replace("/dashboard");
      }
    }

    checkAccess();
  }, [router]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  }

  function validateForm() {
    const missingFields = [];

    if (!form.title.trim()) missingFields.push("Titre");
    if (!form.category.trim()) missingFields.push("Catégorie");
    if (!form.description.trim()) missingFields.push("Description");
    if (!form.difficulty.trim()) missingFields.push("Difficulté");
    if (!form.system_prompt.trim()) missingFields.push("System prompt");

    if (missingFields.length > 0) {
      return `Veuillez remplir les champs obligatoires : ${missingFields.join(", ")}.`;
    }

    if (form.title.trim().length < 3) {
      return "Le titre doit contenir au moins 3 caractères.";
    }

    if (form.description.trim().length < 10) {
      return "La description doit contenir au moins 10 caractères.";
    }

    if (form.system_prompt.trim().length < 20) {
      return "Le system prompt doit contenir au moins 20 caractères.";
    }

    return "";
  }

async function handleSubmit(e) {
  e.preventDefault();

  setError("");
  setLoading(true);

  const validationError = validateForm();
  if (validationError) {
    setError(validationError);
    setLoading(false);
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    setLoading(false);
    router.replace("/auth/login");
    return;
  }

  const difficultyMap = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };

  try {
    await createScenario(token, {
      title: form.title,
      description: form.description,
      category: form.category,
      difficulty: difficultyMap[form.difficulty] ?? 1,
      system_prompt: form.system_prompt,
    });

    router.push("/dashboard/admin/scenarios");
  } catch (err) {
    console.error("Erreur création scénario:", err);

    const message =
      typeof err === "string"
        ? err
        : err?.message
        ? err.message
        : "Impossible de créer le scénario.";

    setError(message);
  } finally {
    setLoading(false);
  }
}

  if (pageLoading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="page-container">
            <Card
              style={{
                padding: "24px",
                borderRadius: "24px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "28px",
                  fontWeight: "800",
                }}
              >
                Chargement de la page...
              </h1>
              <p
                style={{
                  margin: "12px 0 0",
                  color: "#64748b",
                  lineHeight: 1.7,
                  fontSize: "15px",
                }}
              >
                Nous préparons le formulaire de création de scénario.
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
            max-width: 1100px;
            margin: 0 auto;
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
          <Card
            style={{
              padding: "30px",
              borderRadius: "30px",
              background:
                "linear-gradient(135deg, #ffffff, #eff6ff 55%, #dbeafe)",
              border: "1px solid #dbeafe",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
              marginBottom: "24px",
            }}
          >
            <div className="hero-row">
              <div className="hero-main">
                <p className="hero-eyebrow">Dashboard admin</p>
                <h1 className="hero-title">Créer un nouveau scénario</h1>
                <p className="hero-text">
                  Ajoute un nouveau scénario à la plateforme depuis l’espace
                  administrateur.
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
                  Retour au dashboard admin
                </Button>
              </div>
            </div>
          </Card>

          <section>
            <SectionHeader
              eyebrow="Formulaire"
              title="Informations du scénario"
              description="Remplis les champs ci-dessous pour créer un nouveau scénario."
            />

            {error && (
              <Alert
                type="error"
                style={{ borderRadius: "18px", marginBottom: "16px" }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                type="success"
                style={{ borderRadius: "18px", marginBottom: "16px" }}
              >
                {success}
              </Alert>
            )}

            <Card
              style={{
                padding: "24px",
                borderRadius: "24px",
              }}
            >
              <form onSubmit={handleSubmit} className="form-grid">
                <div className="field">
                  <label className="label" htmlFor="title">
                    Titre
                  </label>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="input"
                    placeholder="Ex: Entretien d’embauche développeur web"
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="category">
                    Catégorie
                  </label>
                  <input
                    id="category"
                    type="text"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="input"
                    placeholder="Ex: Job Interview"
                  />
                </div>

                <div className="field field-full">
                  <label className="label" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="textarea"
                    placeholder="Décris brièvement le scénario..."
                    rows={4}
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="difficulty">
                    Difficulté
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="beginner">beginner</option>
                    <option value="intermediate">intermediate</option>
                    <option value="advanced">advanced</option>
                  </select>
                </div>

                <div className="field field-full">
                  <label className="label" htmlFor="system_prompt">
                    System prompt
                  </label>
                  <textarea
                    id="system_prompt"
                    name="system_prompt"
                    value={form.system_prompt}
                    onChange={handleChange}
                    className="textarea"
                    placeholder="Décris précisément le comportement attendu de l’IA..."
                    rows={8}
                  />
                </div>

                <div className="actions">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Création..." : "Créer le scénario"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push("/dashboard/admin")}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </Card>
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
          max-width: 1100px;
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

        .hero-eyebrow {
          margin: 0;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 10px 0 12px;
          color: #0f172a;
          font-size: clamp(28px, 4vw, 42px);
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

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        .label {
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
        }

        .input,
        .textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 14px 16px;
          font-size: 15px;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }

        .input:focus,
        .textarea:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .textarea {
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
        }

        .actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 8px;
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

          .form-grid {
            grid-template-columns: 1fr;
          }

          .field-full {
            grid-column: auto;
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

          .hero-actions,
          .actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </>
  );
}