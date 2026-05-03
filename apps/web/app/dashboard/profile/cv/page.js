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
          background:
            radial-gradient(circle at 10% 0%, rgba(37, 99, 235, 0.32), transparent 30%),
            radial-gradient(circle at 92% 8%, rgba(124, 58, 237, 0.22), transparent 28%),
            linear-gradient(180deg, #030712 0%, #0f172a 58%, #e8eefc 100%);
        }

        .cv-shell {
          max-width: 1100px;
          margin: 0 auto;
          padding: 34px 20px 72px;
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
          border: 1px solid rgba(147, 197, 253, 0.24);
          border-radius: 28px;
          padding: 28px;
          margin-bottom: 20px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.52)),
            rgba(255, 255, 255, 0.07);
          box-shadow: 0 28px 90px rgba(2, 6, 23, 0.32);
          backdrop-filter: blur(18px);
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #93c5fd;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 900;
          font-size: 13px;
          line-height: 1.4;
        }

        h1 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1.05;
          font-weight: 950;
        }

        h2 {
          margin: 0 0 16px;
          color: #ffffff;
          font-size: 24px;
          font-weight: 950;
        }

        h3 {
          margin: 0 0 10px;
          color: #f1f5f9;
          font-size: 18px;
          font-weight: 900;
        }

        .description,
        .hint {
          color: #dbeafe;
          font-size: 16px;
          line-height: 1.75;
        }

        .muted {
          color: #c7d2fe;
          font-size: 15px;
          line-height: 1.65;
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
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 16px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.96);
          color: #0f172a;
          font-size: 15px;
        }

        .primary-btn,
        .secondary-btn,
        .danger-btn {
          appearance: none;
          font-family: inherit;
          border-radius: 999px;
          padding: 14px 22px;
          font-size: 16px;
          font-weight: 850;
          cursor: pointer;
          min-height: 50px;
          transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .primary-btn:focus-visible,
        .secondary-btn:focus-visible,
        .danger-btn:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .primary-btn {
          border: none;
          background: linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #22d3ee 100%);
          color: #0f172a;
          box-shadow: 0 18px 44px rgba(37, 99, 235, 0.3);
        }

        .primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .secondary-btn {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(96, 165, 250, 0.08));
          color: #f8fafc;
          border: 1px solid rgba(147, 197, 253, 0.35);
        }

        .secondary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: rgba(34, 211, 238, 0.55);
        }

        .danger-btn {
          background: linear-gradient(135deg, rgba(185, 28, 28, 0.85), rgba(127, 29, 29, 0.75));
          color: #ffffff;
          border: 1px solid rgba(252, 165, 165, 0.45);
          box-shadow: 0 14px 36px rgba(127, 29, 29, 0.25);
        }

        .danger-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .primary-btn:disabled,
        .danger-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .info-box,
        .success-box,
        .error-box {
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 20px;
          font-weight: 650;
          font-size: 15px;
          line-height: 1.65;
        }

        .info-box {
          background: rgba(30, 58, 138, 0.45);
          border: 1px solid rgba(147, 197, 253, 0.35);
          color: #dbeafe;
        }

        .success-box {
          background: rgba(22, 101, 52, 0.35);
          border: 1px solid rgba(74, 222, 128, 0.35);
          color: #bbf7d0;
        }

        .error-box {
          background: rgba(127, 29, 29, 0.4);
          border: 1px solid rgba(252, 165, 165, 0.4);
          color: #fecaca;
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
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid rgba(147, 197, 253, 0.2);
          border-radius: 18px;
          padding: 16px;
        }

        .raw-text summary {
          cursor: pointer;
          font-weight: 850;
          color: #e0f2fe;
          font-size: 15px;
        }

        pre {
          white-space: pre-wrap;
          word-break: break-word;
          color: #cbd5e1;
          line-height: 1.7;
          font-size: 14px;
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
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(147, 197, 253, 0.2);
          border-radius: 20px;
          padding: 18px;
        }

        .profile-box.full {
          grid-column: 1 / -1;
        }

        .profile-box p {
          color: #dbeafe;
          line-height: 1.75;
          font-size: 15px;
          margin: 6px 0;
        }

        ul {
          margin: 0;
          padding-left: 18px;
          color: #dbeafe;
          line-height: 1.75;
          font-size: 15px;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .skill-category {
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(147, 197, 253, 0.18);
          border-radius: 16px;
          padding: 14px;
        }

        .skill-category strong {
          display: block;
          color: #ffffff;
          margin-bottom: 8px;
          font-size: 16px;
        }

        @media (max-width: 700px) {
          .cv-shell {
            padding: 22px 14px 56px;
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