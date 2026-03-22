"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { loginUser } from "../../lib/api";

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5.5 19 2 12 2 12a21.8 21.8 0 0 1 5.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a21.3 21.3 0 0 1-2.17 3.19" />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function validateForm() {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "L’email est obligatoire.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Veuillez entrer un email valide.";
    }

    if (!form.password.trim()) {
      newErrors.password = "Le mot de passe est obligatoire.";
    } else if (form.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const data = await loginUser({
        email: form.email,
        password: form.password,
      });

      const token = data?.access_token || data?.token;

      if (!token) {
        throw new Error("Token non reçu depuis le backend.");
      }

      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (err) {
      setError(err?.message || "Échec de connexion.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "15px",
    background: "rgba(248,250,252,0.92)",
    color: "#0f172a",
    transition: "all 0.2s ease",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
        background: "#f8fafc",
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

      {!isMobile && (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at top left, rgba(59,130,246,0.22), transparent 32%), linear-gradient(135deg, #0f172a, #1e293b)",
            color: "#ffffff",
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
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
              bottom: "60px",
              left: "-60px",
              width: "180px",
              height: "180px",
              borderRadius: "999px",
              background: "rgba(59,130,246,0.18)",
              animation: "floatSoft 6s ease-in-out infinite",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, animation: "fadeUp 0.45s ease" }}>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: "13px",
                fontWeight: "700",
                marginBottom: "22px",
              }}
            >
              Street University
            </div>

            <h1
              style={{
                fontSize: "54px",
                lineHeight: 1.02,
                margin: 0,
                maxWidth: "560px",
                letterSpacing: "-0.04em",
              }}
            >
              Connecte-toi et continue ton parcours.
            </h1>

            <p
              style={{
                marginTop: "18px",
                fontSize: "17px",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.84)",
                maxWidth: "560px",
              }}
            >
              Reprends l’entraînement, accède à ton dashboard et prépare tes
              prochaines simulations dans une interface plus moderne.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "24px 14px" : "32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "490px", animation: "fadeUp 0.55s ease" }}>
          <div style={{ marginBottom: "22px", textAlign: isMobile ? "center" : "left" }}>
            <p
              style={{
                margin: 0,
                color: "#2563eb",
                fontWeight: "700",
                fontSize: "14px",
                letterSpacing: "0.03em",
              }}
            >
              CONNEXION
            </p>

            <h2
              style={{
                margin: "10px 0 8px",
                color: "#0f172a",
                fontSize: isMobile ? "34px" : "40px",
                lineHeight: 1.05,
                fontWeight: "800",
                letterSpacing: "-0.04em",
              }}
            >
              Bon retour
            </h2>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              Connecte-toi pour accéder à ton dashboard et reprendre tes
              simulations.
            </p>
          </div>

          <Card
            hoverable
            style={{
              padding: isMobile ? "22px 18px" : "30px",
              borderRadius: "28px",
              boxShadow: "0 20px 42px rgba(15,23,42,0.08)",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {error && <Alert type="error">{error}</Alert>}

              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "700",
                    color: "#0f172a",
                    fontSize: "14px",
                  }}
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  style={{
                    ...inputStyle,
                    border: errors.email ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                  }}
                />

                {errors.email && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#dc2626",
                      fontSize: "13px",
                    }}
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "700",
                    color: "#0f172a",
                    fontSize: "14px",
                  }}
                >
                  Mot de passe
                </label>

                <div
                  style={{
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Votre mot de passe"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px 48px 14px 16px",
                      borderRadius: "16px",
                      border: errors.password ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                      outline: "none",
                      fontSize: "15px",
                      background: "rgba(248,250,252,0.92)",
                      color: "#0f172a",
                      transition: "all 0.2s ease",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "14px",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      width: "20px",
                      height: "20px",
                    }}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {errors.password && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#dc2626",
                      fontSize: "13px",
                    }}
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="blue"
                fullWidth
                disabled={loading}
                style={{
                  marginTop: "6px",
                  borderRadius: "18px",
                  minHeight: "52px",
                  fontSize: "15px",
                }}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div
              style={{
                marginTop: "22px",
                paddingTop: "18px",
                borderTop: "1px solid #e2e8f0",
                textAlign: "center",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Pas encore de compte ?{" "}
              <Link
                href="/auth/register"
                style={{
                  color: "#2563eb",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                Créer un compte
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}