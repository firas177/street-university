"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";

export default function HomePage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const features = [
    {
      number: "01",
      title: "Préparation aux situations réelles",
      description:
        "Street University aide les jeunes à s’entraîner sur des contextes concrets : entretien d’embauche, prise de parole, pitch, négociation et leadership.",
    },
    {
      number: "02",
      title: "Développement des soft skills",
      description:
        "La plateforme met l’accent sur la confiance, la communication, la présence, la clarté du discours et la capacité à convaincre.",
    },
    {
      number: "03",
      title: "Une expérience moderne assistée par l’IA",
      description:
        "Le projet est pensé pour évoluer vers des simulations plus avancées, une interaction plus intelligente et de futures fonctionnalités vocales.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatSoft {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(12px)",
          background: "rgba(248,250,252,0.82)",
          borderBottom: "1px solid rgba(226,232,240,0.9)",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: isMobile ? "14px" : "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontWeight: "800",
              fontSize: isMobile ? "22px" : "20px",
              letterSpacing: "-0.03em",
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          >
            Street University
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              width: isMobile ? "100%" : "auto",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => router.push("/auth/login")}
              fullWidth={isMobile}
            >
              Se connecter
            </Button>

            <Button
              variant="blue"
              onClick={() => router.push("/auth/register")}
              fullWidth={isMobile}
            >
              Commencer
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: isMobile ? "28px 14px 24px" : "52px 20px 36px",
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: isMobile ? "24px" : "32px",
              padding: isMobile ? "24px 18px" : "42px",
              background:
                "radial-gradient(circle at top left, rgba(59,130,246,0.22), transparent 32%), linear-gradient(135deg, #0f172a, #1e293b)",
              color: "#ffffff",
              minHeight: isMobile ? "auto" : "520px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow: "0 24px 50px rgba(15,23,42,0.16)",
              animation: "fadeUp 0.45s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-70px",
                right: "-70px",
                width: "220px",
                height: "220px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                animation: "floatSoft 5s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-50px",
                left: "-40px",
                width: "180px",
                height: "180px",
                borderRadius: "999px",
                background: "rgba(59,130,246,0.18)",
                animation: "floatSoft 6s ease-in-out infinite",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: "13px",
                  fontWeight: "700",
                  marginBottom: "18px",
                }}
              >
                Apprendre par la pratique
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? "38px" : "64px",
                  lineHeight: 1.02,
                  letterSpacing: "-0.04em",
                  maxWidth: "820px",
                }}
              >
                Développe les compétences réelles qui font la différence.
              </h1>

              <p
                style={{
                  marginTop: "18px",
                  fontSize: isMobile ? "15px" : "18px",
                  lineHeight: 1.75,
                  color: "rgba(255,255,255,0.84)",
                  maxWidth: "760px",
                }}
              >
                Street University est une plateforme qui prépare les jeunes à la
                vraie vie grâce à des simulations modernes : entretiens,
                communication, leadership, pitch, négociation et confiance en soi.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "24px",
                  flexDirection: isMobile ? "column" : "row",
                  maxWidth: isMobile ? "100%" : "430px",
                }}
              >
                <Button
                  variant="blue"
                  onClick={() => router.push("/auth/register")}
                  fullWidth={isMobile}
                  style={{ minHeight: "52px" }}
                >
                  Créer un compte
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => router.push("/auth/login")}
                  fullWidth={isMobile}
                  style={{ background: "#ffffff" }}
                >
                  Se connecter
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: isMobile ? "10px 14px 40px" : "10px 20px 60px",
          }}
        >
          <div style={{ marginBottom: "20px", animation: "fadeUp 0.7s ease" }}>
            <p
              style={{
                margin: 0,
                color: "#2563eb",
                fontWeight: "700",
                fontSize: "13px",
                letterSpacing: "0.03em",
              }}
            >
              NOS SERVICES
            </p>

            <h2
              style={{
                margin: "10px 0 0",
                fontSize: isMobile ? "30px" : "42px",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              Ce que Street University t’apporte.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "18px",
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                hoverable
                style={{
                  borderRadius: "26px",
                  padding: isMobile ? "20px" : "24px",
                  animation: `fadeUp ${0.75 + index * 0.08}s ease`,
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    marginBottom: "16px",
                  }}
                >
                  {feature.number}
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    lineHeight: 1.15,
                    color: "#0f172a",
                  }}
                >
                  {feature.title}
                </h3>

                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#64748b",
                    fontSize: "15px",
                    lineHeight: 1.75,
                  }}
                >
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer
        style={{
          borderTop: "1px solid #e2e8f0",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: isMobile ? "18px 14px 28px" : "20px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: "800",
                fontSize: "18px",
                letterSpacing: "-0.03em",
              }}
            >
              Street University
            </div>

            <p
              style={{
                margin: "6px 0 0",
                color: "#64748b",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              Une plateforme de simulation et d’apprentissage pratique orientée
              vers la vraie vie.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => router.push("/auth/login")}
              style={{
                border: "none",
                background: "transparent",
                color: "#475569",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Login
            </button>

            <button
              onClick={() => router.push("/auth/register")}
              style={{
                border: "none",
                background: "transparent",
                color: "#475569",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Register
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              style={{
                border: "none",
                background: "transparent",
                color: "#475569",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}