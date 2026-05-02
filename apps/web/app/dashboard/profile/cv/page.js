"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import {
  uploadMyCV,
  getMyCV,
  structureMyCV,
  getMyCVProfile,
  deleteMyCV,
} from "../../../lib/api";

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

function renderList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="muted">Aucune donnée détectée.</p>;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function CVPage() {
  const router = useRouter();

  const [cv, setCv] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [structuring, setStructuring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCVData() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const cvData = await getMyCV(token);
        setCv(cvData);
      } catch {
        setCv(null);
      }

      try {
        const profileData = await getMyCVProfile(token);
        setProfile(profileData?.profile || null);
      } catch {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCVData();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();

    if (!selectedFile) {
      setError("Veuillez sélectionner un fichier PDF.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setUploading(true);
      setError("");
      setSuccess("");

      const data = await uploadMyCV(token, selectedFile);

      setCv(data);
      setProfile(null);
      setSelectedFile(null);
      setSuccess("CV uploadé avec succès. Vous pouvez maintenant générer le profil structuré.");
    } catch (err) {
      setError(err?.message || "Impossible d'uploader le CV.");
    } finally {
      setUploading(false);
    }
  }

  async function handleStructureCV() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setStructuring(true);
      setError("");
      setSuccess("");

      const data = await structureMyCV(token);

      setProfile(data?.profile || null);
      setSuccess("Profil CV structuré généré avec succès.");
    } catch (err) {
      setError(err?.message || "Impossible de générer le profil CV.");
    } finally {
      setStructuring(false);
    }
  }

  async function handleDeleteCV() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      setDeleting(true);
      setError("");
      setSuccess("");

      await deleteMyCV(token);

      setCv(null);
      setProfile(null);
      setSelectedFile(null);
      setSuccess("CV supprimé avec succès.");
    } catch (err) {
      setError(err?.message || "Impossible de supprimer le CV.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-root">
      <Navbar />

      <main className="cv-shell">
        <div className="top-actions">
          <button
            type="button"
            onClick={() => router.push("/dashboard/profile")}
            className="secondary-btn"
          >
            Retour au profil
          </button>
        </div>

        <section className="hero-card">
          <div>
            <p className="eyebrow">CV intelligent</p>
            <h1>CV & profil structuré</h1>
            <p className="description">
              Ajoutez votre CV pour permettre à l’agent IA de poser des questions plus précises pendant les simulations.
              Si aucun CV n’est ajouté, la simulation reste normale.
            </p>
          </div>
        </section>

        {loading && (
          <div className="info-box">
            Chargement des informations CV...
          </div>
        )}

        {error && !loading && (
          <div className="error-box">{error}</div>
        )}

        {success && !loading && (
          <div className="success-box">{success}</div>
        )}

        {!loading && (
          <>
            <section className="upload-card">
              <h2>Uploader un CV PDF</h2>

              <form onSubmit={handleUpload} className="upload-form">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="file-input"
                />

                <button
                  type="submit"
                  disabled={uploading}
                  className="primary-btn"
                >
                  {uploading ? "Upload en cours..." : "Uploader le CV"}
                </button>
              </form>

              <p className="hint">
                Format accepté : PDF. Le backend extrait automatiquement le texte du CV.
              </p>
            </section>

            {cv && (
              <section className="cv-card">
                <div className="cv-header">
                  <div>
                    <h2>CV actuel</h2>
                    <p className="muted">
                      Fichier : <strong>{cv.filename || "Sans nom"}</strong>
                    </p>
                    <p className="muted">
                      Uploadé le : {formatDate(cv.created_at)}
                    </p>
                    <p className="muted">
                      Modifié le : {formatDate(cv.updated_at)}
                    </p>
                  </div>

                  <div className="cv-actions">
                    <button
                      type="button"
                      onClick={handleStructureCV}
                      disabled={structuring}
                      className="primary-btn"
                    >
                      {structuring
                        ? "Génération..."
                        : profile
                        ? "Regénérer profil CV"
                        : "Générer profil CV"}
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteCV}
                      disabled={deleting}
                      className="danger-btn"
                    >
                      {deleting ? "Suppression..." : "Supprimer CV"}
                    </button>
                  </div>
                </div>

                <details className="raw-text">
                  <summary>Voir texte extrait</summary>
                  <pre>{cv.extracted_text}</pre>
                </details>
              </section>
            )}

            {profile && (
              <section className="profile-card">
                <div className="section-title">
                  <p className="eyebrow">Profil structuré</p>
                  <h2>Analyse automatique du CV</h2>
                </div>

                <div className="profile-grid">
                  <div className="profile-box full">
                    <h3>Résumé professionnel</h3>
                    <p>{profile.professional_summary || "Non disponible."}</p>
                  </div>

                  <div className="profile-box">
                    <h3>Contact</h3>
                    <p>Email : {profile.contact?.email || "Non détecté"}</p>
                    <p>Téléphone : {profile.contact?.phone || "Non détecté"}</p>
                    <p>GitHub : {profile.contact?.github || "Non détecté"}</p>
                    <p>LinkedIn : {profile.contact?.linkedin || "Non détecté"}</p>
                  </div>

                  <div className="profile-box">
                    <h3>Langues</h3>
                    {renderList(profile.languages)}
                  </div>

                  <div className="profile-box">
                    <h3>Formation</h3>
                    {renderList(profile.education)}
                  </div>

                  <div className="profile-box">
                    <h3>Expériences</h3>
                    {renderList(profile.experience)}
                  </div>

                  <div className="profile-box full">
                    <h3>Projets</h3>
                    {renderList(profile.projects)}
                  </div>

                  <div className="profile-box full">
                    <h3>Compétences techniques</h3>

                    {profile.technical_skills ? (
                      <div className="skills-grid">
                        {Object.entries(profile.technical_skills).map(
                          ([category, skills]) => (
                            <div key={category} className="skill-category">
                              <strong>{category}</strong>
                              {renderList(skills)}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="muted">Aucune compétence détectée.</p>
                    )}
                  </div>

                  <div className="profile-box full">
                    <h3>Certifications</h3>
                    {renderList(profile.certifications)}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        .page-root {
          min-height: 100vh;
          background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
        }

        .cv-shell {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        .top-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }

        .hero-card,
        .upload-card,
        .cv-card,
        .profile-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          margin-bottom: 20px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 900;
          font-size: 13px;
        }

        h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1;
        }

        h2 {
          margin: 0 0 16px;
          color: #0f172a;
          font-size: 26px;
        }

        h3 {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 18px;
        }

        .description,
        .hint,
        .muted {
          color: #64748b;
          line-height: 1.7;
        }

        .upload-form {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .file-input {
          flex: 1;
          min-width: 260px;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 12px;
          background: #f8fafc;
        }

        .primary-btn,
        .secondary-btn,
        .danger-btn {
          border: none;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 800;
          cursor: pointer;
        }

        .primary-btn {
          background: #2563eb;
          color: #ffffff;
        }

        .secondary-btn {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
        }

        .danger-btn {
          background: #ef4444;
          color: #ffffff;
        }

        .primary-btn:disabled,
        .danger-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .info-box,
        .success-box,
        .error-box {
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 20px;
          font-weight: 700;
        }

        .info-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        }

        .success-box {
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .error-box {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .cv-header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }

        .cv-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .raw-text {
          margin-top: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
        }

        .raw-text summary {
          cursor: pointer;
          font-weight: 800;
          color: #0f172a;
        }

        pre {
          white-space: pre-wrap;
          word-break: break-word;
          color: #334155;
          line-height: 1.7;
          max-height: 350px;
          overflow: auto;
        }

        .section-title {
          margin-bottom: 20px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .profile-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 18px;
        }

        .profile-box.full {
          grid-column: 1 / -1;
        }

        .profile-box p {
          color: #475569;
          line-height: 1.7;
          margin: 6px 0;
        }

        ul {
          margin: 0;
          padding-left: 18px;
          color: #475569;
          line-height: 1.7;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .skill-category {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
        }

        .skill-category strong {
          display: block;
          color: #0f172a;
          margin-bottom: 8px;
        }

        @media (max-width: 700px) {
          .cv-shell {
            padding: 22px 12px 50px;
          }

          .hero-card,
          .upload-card,
          .cv-card,
          .profile-card {
            padding: 20px;
            border-radius: 22px;
          }

          .profile-grid {
            grid-template-columns: 1fr;
          }

          .file-input,
          .primary-btn,
          .secondary-btn,
          .danger-btn {
            width: 100%;
          }

          .top-actions {
            justify-content: stretch;
          }

          h1 {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}