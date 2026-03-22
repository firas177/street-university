"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { registerUser } from "../../lib/api";

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

export default function RegisterPage() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

    if (!form.full_name.trim()) {
      newErrors.full_name = "Le nom complet est obligatoire.";
    } else if (form.full_name.trim().length < 3) {
      newErrors.full_name = "Le nom doit contenir au moins 3 caractères.";
    }

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

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Veuillez confirmer le mot de passe.";
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
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
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await registerUser({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });

      setSuccess("Compte créé avec succès. Redirection vers la connexion...");

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err) {
      setError(err?.message || "Échec de l’inscription.");
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
        gridTemplateColumns: isMobile ? "1fr" : "0.95fr 1.05fr",
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "24px 14px" : "32px",
          order: isMobile ? 2 : 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "520px", animation: "fadeUp 0.55s ease" }}>
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
              INSCRIPTION
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
              Crée ton compte
            </h2>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              Rejoins Street University et commence à structurer ton parcours
              d’apprentissage pratique.
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
              {success && <Alert type="success">{success}</Alert>}

              <div>
                <label
                  htmlFor="full_name"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "700",
                    color: "#0f172a",
                    fontSize: "14px",
                  }}
                >
                  Nom complet
                </label>

                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Votre nom complet"
                  style={{
                    ...inputStyle,
                    border: errors.full_name ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                  }}
                />

                {errors.full_name && (
                  <p style={{ margin: "8px 0 0", color: "#dc2626", fontSize: "13px" }}>
                    {errors.full_name}
                  </p>
                )}
              </div>

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
                  <p style={{ margin: "8px 0 0", color: "#dc2626", fontSize: "13px" }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "16px",
                }}
              >
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

                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 caractères"
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
                    <p style={{ margin: "8px 0 0", color: "#dc2626", fontSize: "13px" }}>
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "700",
                      color: "#0f172a",
                      fontSize: "14px",
                    }}
                  >
                    Confirmation
                  </label>

                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirme le mot de passe"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "14px 48px 14px 16px",
                        borderRadius: "16px",
                        border: errors.confirmPassword
                          ? "1px solid #fca5a5"
                          : "1px solid #cbd5e1",
                        outline: "none",
                        fontSize: "15px",
                        background: "rgba(248,250,252,0.92)",
                        color: "#0f172a",
                        transition: "all 0.2s ease",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
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
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p style={{ margin: "8px 0 0", color: "#dc2626", fontSize: "13px" }}>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
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
                {loading ? "Création..." : "Créer un compte"}
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
              Tu as déjà un compte ?{" "}
              <Link
                href="/auth/login"
                style={{
                  color: "#2563eb",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                Se connecter
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {!isMobile && (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at top right, rgba(59,130,246,0.22), transparent 32%), linear-gradient(135deg, #0f172a, #1e293b)",
            color: "#ffffff",
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            order: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-80px",
              left: "-80px",
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
              right: "-60px",
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
              Rejoins la plateforme et commence à construire.
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
              Crée ton compte pour accéder au dashboard, au profil et à une base
              front moderne prête pour la suite du projet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}