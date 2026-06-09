"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import { forgotPassword } from "../lib/api";

const GENERIC_SUCCESS =
  "Si cet email existe, un lien de réinitialisation a été envoyé.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim()) {
      setError("Merci de saisir votre adresse email.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await forgotPassword(email.trim());
      setSuccess(data?.message || GENERIC_SUCCESS);
    } catch (err) {
      setError(err.message || "Impossible d'envoyer le lien de réinitialisation.");
    } finally {
      setLoading(false);
    }
  }

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
            RÉINITIALISATION
          </p>

          <h1
            style={{
              marginTop: 0,
              marginBottom: "10px",
              color: "#0f172a",
              fontSize: "34px",
            }}
          >
            Mot de passe oublié
          </h1>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>

          {error && (
            <Alert type="warning" style={{ marginBottom: "16px" }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" style={{ marginBottom: "16px" }}>
              {success}
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#0f172a",
                    fontWeight: "600",
                  }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  autoComplete="email"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid #cbd5e1",
                    outline: "none",
                    fontSize: "15px",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                fullWidth
                variant="blue"
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
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
          </div>
        </Card>
      </main>
    </div>
  );
}
