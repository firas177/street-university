"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";

const FEATURES = [
  { title: "Simulations IA", desc: "Scénarios réalistes avec un agent qui réagit comme en situation réelle." },
  { title: "Entraînement soft skills", desc: "Communication, confiance, clarté et posture professionnelle." },
  { title: "Messages vocaux", desc: "Répondez à voix haute et entraînez votre aisance orale." },
  { title: "Analyse sentimentale", desc: "Signaux vocaux et ton pris en compte pour enrichir le feedback." },
  { title: "CV intelligent", desc: "Votre CV structure les questions pour des simulations plus pertinentes." },
  { title: "Feedback et score détaillé", desc: "Scores par critère et conseils actionnables après chaque session." },
];

const STEPS = [
  { n: "1", title: "Crée ton compte", text: "Inscris-toi ou connecte-toi pour accéder au cockpit d’entraînement." },
  { n: "2", title: "Choisis un scénario", text: "Sélectionne une simulation adaptée à ton objectif (entretien, pitch, etc.)." },
  { n: "3", title: "Joue la scène", text: "Échange en texte ou en vocal avec l’IA dans le temps imparti." },
  { n: "4", title: "Analyse tes résultats", text: "Consulte scores, sentiment et recommandations pour progresser vite." },
];

const VALUE_PROPS = [
  {
    title: "Préparer entretiens",
    text: "Anticipe les questions, structure tes réponses et gagne en assurance avant le jour J.",
  },
  {
    title: "Améliorer communication",
    text: "Travaille clarté, ton et écoute active avec un partenaire IA disponible 24h/24.",
  },
  {
    title: "Recevoir feedback IA",
    text: "Obtiens une lecture structurée de tes forces, axes d’amélioration et prochaines étapes.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setHasToken(!!token);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="landing-root">
      <Navbar />

      <main className="landing-main">
        <section className="hero" aria-labelledby="landing-hero-title">
          <div className="hero-glow" aria-hidden />
          <div className="hero-inner">
            <p className="hero-kicker">
              <span className="pulse-dot" aria-hidden />
              Plateforme IA · Soft skills
            </p>
            <h1 id="landing-hero-title" className="hero-title">
              Street University : l’entraînement qui transforme tes entretiens et ta prise de parole.
            </h1>
            <p className="hero-lead">
              Simulations guidées, voix, analyse de sentiment et CV intelligent — tout pour progresser avec un
              feedback clair, comme un coach disponible à la demande.
            </p>

            <div className="hero-cta-row">
              {hasToken ? (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => router.push("/dashboard")}>
                    Tableau de bord
                  </button>
                  <button type="button" className="btn btn-glass" onClick={() => router.push("/scenarios")}>
                    Voir les scénarios
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => router.push("/auth/register")}>
                    Commencer maintenant
                  </button>
                  <button type="button" className="btn btn-glass" onClick={() => router.push("/auth/login")}>
                    Se connecter
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => router.push("/scenarios")}>
                    Voir les scénarios
                  </button>
                </>
              )}
            </div>

            <ul className="hero-trust" aria-label="Points forts produit">
              <li>IA conversationnelle</li>
              <li>Données orientées progression</li>
              <li>Expérience pensée pour l’apprentissage</li>
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="features-title">
          <div className="section-head">
            <p className="eyebrow">Fonctionnalités</p>
            <h2 id="features-title" className="section-title">
              Une suite complète pour t’entraîner comme en conditions réelles
            </h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="feature-card">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-tint" aria-labelledby="how-title">
          <div className="section-head">
            <p className="eyebrow">Parcours</p>
            <h2 id="how-title" className="section-title">
              Comment ça marche ?
            </h2>
          </div>
          <ol className="steps-grid">
            {STEPS.map((s) => (
              <li key={s.n} className="step-card">
                <span className="step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="value-title">
          <div className="section-head">
            <p className="eyebrow">Pourquoi Street University</p>
            <h2 id="value-title" className="section-title">
              Une valeur claire pour ton parcours pro
            </h2>
          </div>
          <div className="value-grid">
            {VALUE_PROPS.map((v) => (
              <article key={v.title} className="value-card">
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-band" aria-label="Appel à l’action">
          <div className="cta-band-inner">
            <div>
              <h2 className="cta-title">Prêt à monter en gamme ?</h2>
              <p className="cta-text">
                Rejoins Street University et enchaîne les simulations pour des soft skills mesurables et durables.
              </p>
            </div>
            <div className="cta-band-actions">
              {hasToken ? (
                <button type="button" className="btn btn-primary" onClick={() => router.push("/scenarios")}>
                  Lancer une simulation
                </button>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => router.push("/auth/register")}>
                    Commencer maintenant
                  </button>
                  <button type="button" className="btn btn-glass" onClick={() => router.push("/auth/login")}>
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .landing-root {
          min-height: 100vh;
          background:
            radial-gradient(circle at 12% 0%, rgba(59, 130, 246, 0.45), transparent 32%),
            radial-gradient(circle at 88% 8%, rgba(124, 58, 237, 0.35), transparent 30%),
            linear-gradient(180deg, #030712 0%, #0a1628 45%, #0f172a 72%, #e8eefc 100%);
          color: #f8fafc;
        }

        .landing-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 20px 80px;
        }

        .hero {
          position: relative;
          overflow: hidden;
          border-radius: 36px;
          border: 1px solid rgba(147, 197, 253, 0.28);
          background:
            linear-gradient(135deg, rgba(3, 7, 18, 0.94), rgba(15, 23, 42, 0.88)),
            radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.45), transparent 40%),
            radial-gradient(circle at 90% 10%, rgba(34, 211, 238, 0.2), transparent 35%);
          box-shadow:
            0 40px 120px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(22px);
          padding: clamp(28px, 5vw, 52px);
          margin-bottom: 40px;
        }

        .hero-glow {
          position: absolute;
          width: 420px;
          height: 420px;
          right: -120px;
          top: -140px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 68%);
          pointer-events: none;
        }

        .hero-inner {
          position: relative;
          z-index: 1;
          max-width: 880px;
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 20px;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(191, 219, 254, 0.28);
          background: rgba(255, 255, 255, 0.08);
          color: #dbeafe;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .pulse-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.2);
        }

        .hero-title {
          margin: 0 0 18px;
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -0.03em;
          color: #ffffff;
        }

        .hero-lead {
          margin: 0 0 28px;
          font-size: 18px;
          line-height: 1.7;
          color: #dbeafe;
          font-weight: 500;
          max-width: 720px;
        }

        .hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 28px;
        }

        .btn {
          appearance: none;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 999px;
          font-size: 16px;
          font-weight: 850;
          min-height: 52px;
          padding: 14px 24px;
          border: 1px solid transparent;
          transition:
            transform 0.18s ease,
            box-shadow 0.22s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            color 0.2s ease;
        }

        .btn:focus-visible {
          outline: 2px solid #38bdf8;
          outline-offset: 3px;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn-primary {
          background: linear-gradient(135deg, #ffffff 0%, #bfdbfe 45%, #22d3ee 100%);
          color: #0f172a;
          box-shadow: 0 20px 50px rgba(37, 99, 235, 0.35);
        }

        .btn-primary:hover {
          box-shadow: 0 24px 60px rgba(34, 211, 238, 0.3);
        }

        .btn-glass {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(96, 165, 250, 0.1));
          color: #f8fafc;
          border-color: rgba(147, 197, 253, 0.35);
          backdrop-filter: blur(12px);
        }

        .btn-glass:hover {
          border-color: rgba(34, 211, 238, 0.65);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(96, 165, 250, 0.16));
        }

        .btn-outline {
          background: rgba(15, 23, 42, 0.35);
          color: #e0f2fe;
          border-color: rgba(147, 197, 253, 0.4);
        }

        .btn-outline:hover {
          border-color: rgba(34, 211, 238, 0.75);
          color: #ffffff;
        }

        .hero-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .hero-trust li {
          font-size: 15px;
          line-height: 1.5;
          color: #c7d2fe;
          font-weight: 650;
        }

        .hero-trust li::before {
          content: "✓ ";
          color: #22d3ee;
          font-weight: 900;
        }

        .section {
          margin-bottom: 48px;
        }

        .section-tint {
          padding: 40px 28px;
          margin-left: -8px;
          margin-right: -8px;
          border-radius: 32px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.55), rgba(30, 41, 59, 0.35)),
            rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
        }

        .section-head {
          margin-bottom: 24px;
          max-width: 720px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #93c5fd;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          line-height: 1.4;
        }

        .section-title {
          margin: 0;
          font-size: clamp(26px, 3.5vw, 38px);
          line-height: 1.2;
          font-weight: 950;
          color: #ffffff;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }

        .feature-card {
          border-radius: 24px;
          border: 1px solid rgba(147, 197, 253, 0.22);
          padding: 24px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.5)),
            rgba(255, 255, 255, 0.06);
          box-shadow: 0 24px 70px rgba(2, 6, 23, 0.35);
          backdrop-filter: blur(18px);
        }

        .feature-card h3 {
          margin: 0 0 12px;
          font-size: 19px;
          font-weight: 950;
          color: #ffffff;
        }

        .feature-card p {
          margin: 0;
          font-size: 16px;
          line-height: 1.7;
          color: #dbeafe;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .step-card {
          border-radius: 22px;
          border: 1px solid rgba(147, 197, 253, 0.2);
          padding: 22px;
          background: rgba(15, 23, 42, 0.5);
        }

        .step-num {
          display: inline-grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #22d3ee);
          color: #ffffff;
          font-size: 16px;
          font-weight: 950;
          margin-bottom: 14px;
        }

        .step-card h3 {
          margin: 0 0 10px;
          font-size: 18px;
          font-weight: 900;
          color: #ffffff;
        }

        .step-card p {
          margin: 0;
          font-size: 16px;
          line-height: 1.7;
          color: #dbeafe;
        }

        .value-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }

        .value-card {
          border-radius: 24px;
          border: 1px solid rgba(147, 197, 253, 0.24);
          padding: 26px;
          background:
            radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.25), transparent 45%),
            linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.55));
          box-shadow: 0 26px 80px rgba(2, 6, 23, 0.32);
        }

        .value-card h3 {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 950;
          color: #ffffff;
        }

        .value-card p {
          margin: 0;
          font-size: 16px;
          line-height: 1.75;
          color: #dbeafe;
        }

        .cta-band {
          border-radius: 32px;
          border: 1px solid rgba(147, 197, 253, 0.3);
          padding: clamp(24px, 4vw, 40px);
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(15, 23, 42, 0.92)),
            rgba(255, 255, 255, 0.06);
          box-shadow: 0 32px 90px rgba(37, 99, 235, 0.2);
          backdrop-filter: blur(20px);
        }

        .cta-band-inner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .cta-title {
          margin: 0 0 10px;
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 950;
          color: #ffffff;
        }

        .cta-text {
          margin: 0;
          max-width: 520px;
          font-size: 16px;
          line-height: 1.7;
          color: #e0f2fe;
        }

        .cta-band-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .landing-main {
            padding: 18px 14px 56px;
          }

          .hero {
            border-radius: 26px;
            padding: 24px 20px;
          }

          .hero-cta-row,
          .cta-band-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .btn {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .section-tint {
            padding: 28px 18px;
            margin-left: 0;
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
}
