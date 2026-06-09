"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { resetPassword } from "../lib/api";

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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      router.push("/auth/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success, router]);

  function validateForm() {
    const nextErrors = {};

    if (!token.trim()) {
      nextErrors.token = "Lien de réinitialisation invalide ou manquant.";
    }

    if (!password.trim()) {
      nextErrors.password = "Le mot de passe est obligatoire.";
    } else if (password.length < 8) {
      nextErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Veuillez confirmer le mot de passe.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await resetPassword(token.trim(), password);
      setSuccess(data?.message || "Mot de passe réinitialisé avec succès.");
    } catch (err) {
      setError(err.message || "Impossible de réinitialiser le mot de passe.");
    } finally {
      setLoading(false);
    }
  }

  const missingToken = !token.trim();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />

      <main
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          padding: "48px 20px",
        }}
      >
        <Card
          style={{
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#2563eb",
              fontWeight: "700",
              fontSize: "13px",
              letterSpacing: "0.04em",
            }}
          >
            NOUVEAU MOT DE PASSE
          </p>

          <h1
            style={{
              marginTop: 0,
              marginBottom: "10px",
              color: "#0f172a",
              fontSize: "34px",
            }}
          >
            Réinitialiser le mot de passe
          </h1>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>

          {missingToken && (
            <Alert type="warning" style={{ marginBottom: "16px" }}>
              Lien de réinitialisation invalide ou manquant. Demandez un nouveau lien
              depuis la page mot de passe oublié.
            </Alert>
          )}

          {error && (
            <Alert type="warning" style={{ marginBottom: "16px" }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" style={{ marginBottom: "16px" }}>
              {success} Redirection vers la connexion...
            </Alert>
          )}

          {!success && !missingToken && (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#0f172a",
                    fontWeight: "600",
                  }}
                >
                  Nouveau mot de passe
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px 48px 14px 16px",
                      borderRadius: "14px",
                      border: errors.password
                        ? "1px solid #fca5a5"
                        : "1px solid #cbd5e1",
                      outline: "none",
                      fontSize: "15px",
                      background: "#ffffff",
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
                    }}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
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
                    color: "#0f172a",
                    fontWeight: "600",
                  }}
                >
                  Confirmation
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    placeholder="Confirmez le mot de passe"
                    autoComplete="new-password"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px 48px 14px 16px",
                      borderRadius: "14px",
                      border: errors.confirmPassword
                        ? "1px solid #fca5a5"
                        : "1px solid #cbd5e1",
                      outline: "none",
                      fontSize: "15px",
                      background: "#ffffff",
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
                    }}
                    aria-label={
                      showConfirmPassword
                        ? "Masquer la confirmation"
                        : "Afficher la confirmation"
                    }
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

              <Button type="submit" disabled={loading} fullWidth variant="blue">
                {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </Button>
            </form>
          )}

          <div
            style={{
              marginTop: "18px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {success ? (
              <Link
                href="/auth/login"
                style={{
                  color: "#2563eb",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Retour à la connexion
              </Link>
            ) : missingToken ? (
              <Link
                href="/forgot-password"
                style={{
                  color: "#2563eb",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Demander un nouveau lien
              </Link>
            ) : (
              <Link
                href="/auth/login"
                style={{
                  color: "#2563eb",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Retour à la connexion
              </Link>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#f8fafc",
            color: "#64748b",
          }}
        >
          Chargement...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
