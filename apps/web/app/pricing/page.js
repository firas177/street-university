"use client";

import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      badge: "Plan actuel de base",
      description:
        "Une version simple pour découvrir Street University et commencer les simulations.",
      features: [
        "Accès à un nombre limité de sessions",
        "Chat texte standard",
        "Accès à une partie des scénarios",
        "Tableau de bord basique",
      ],
      limitations: [
        "Fonctionnalités vocales limitées",
        "Pas d’analytics avancés",
        "Sessions limitées",
      ],
      highlighted: false,
    },
    {
      name: "Premium",
      badge: "Expérience complète",
      description:
        "Débloque une expérience plus riche avec plus de voix, d’analyses et de progression.",
      features: [
        "Sessions illimitées",
        "Fonctionnalités voice avancées",
        "Analytics avancés",
        "Suivi plus complet des performances",
        "Accès prioritaire aux nouvelles fonctionnalités",
      ],
      limitations: [],
      highlighted: true,
      buttonLabel: "Passer au Premium",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-container">
          <Card
            style={{
              padding: "32px",
              borderRadius: "30px",
              background: "linear-gradient(135deg, #ffffff, #eff6ff 50%, #dbeafe)",
              border: "1px solid #dbeafe",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
              marginBottom: "24px",
            }}
          >
            <div className="hero-row">
              <div className="hero-main">
                <p className="eyebrow">Abonnement</p>
                <h1 className="hero-title">Free ou Premium</h1>
                <p className="hero-text">
                  Compare les plans et découvre les fonctionnalités prévues pour
                  l’expérience complète Street University.
                </p>
              </div>
            </div>
          </Card>

          <section>
            <SectionHeader
              eyebrow="Plans"
              title="Choisis ton niveau d’accès"
              description="Interface frontend de démonstration pour les offres Free et Premium."
            />

            <div className="plans-grid">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  style={{
                    padding: "24px",
                    borderRadius: "26px",
                    border: plan.highlighted
                      ? "1px solid #93c5fd"
                      : "1px solid #e2e8f0",
                    boxShadow: plan.highlighted
                      ? "0 18px 40px rgba(37, 99, 235, 0.10)"
                      : "0 12px 30px rgba(15, 23, 42, 0.05)",
                    background: plan.highlighted
                      ? "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)"
                      : "#ffffff",
                  }}
                >
                  <div className="plan-top">
                    <div>
                      <p className={`plan-badge ${plan.highlighted ? "premium" : "free"}`}>
                        {plan.badge}
                      </p>
                      <h2 className="plan-title">{plan.name}</h2>
                    </div>
                  </div>

                  <p className="plan-description">{plan.description}</p>

                  <div className="block">
                    <h3 className="block-title">Fonctionnalités</h3>
                    <div className="feature-list">
                      {plan.features.map((item) => (
                        <div key={item} className="feature-item">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="block">
                      <h3 className="block-title">Limitations</h3>
                      <div className="feature-list">
                        {plan.limitations.map((item) => (
                          <div key={item} className="feature-item muted">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.highlighted && (
                    <div style={{ marginTop: "20px" }}>
                      <Button variant="blue">
                        {plan.buttonLabel}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 45%, #ffffff 100%);
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

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .plan-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          margin: 0 0 12px;
        }

        .plan-badge.free {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #cbd5e1;
        }

        .plan-badge.premium {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .plan-title {
          margin: 0;
          color: #0f172a;
          font-size: 28px;
          font-weight: 900;
        }

        .plan-description {
          margin: 14px 0 0;
          color: #475569;
          line-height: 1.8;
          font-size: 15px;
        }

        .block {
          margin-top: 20px;
        }

        .block-title {
          margin: 0 0 12px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 800;
        }

        .feature-list {
          display: grid;
          gap: 10px;
        }

        .feature-item {
          padding: 12px 14px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 500;
        }

        .feature-item.muted {
          color: #64748b;
        }

        @media (max-width: 900px) {
          .page-shell {
            padding: 28px 18px 48px;
          }

          .plans-grid {
            grid-template-columns: 1fr;
          }

          .hero-row {
            flex-direction: column;
            align-items: stretch;
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
        }
      `}</style>
    </>
  );
}