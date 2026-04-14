"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import { loginUser, getMe } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function checkExistingSession() {
      const token = localStorage.getItem("token");

      if (!token) {
        setMounted(true);
        return;
      }

      try {
        const me = await getMe(token);

        if (me?.role === "admin") {
          router.replace("/dashboard/admin");
          return;
        }

        router.replace("/dashboard");
      } catch {
        localStorage.removeItem("token");
        setMounted(true);
      }
    }

    checkExistingSession();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Merci de remplir l'email et le mot de passe.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const data = await loginUser({
        email: email.trim(),
        password,
      });

      if (!data?.access_token) {
        throw new Error("Token introuvable dans la réponse.");
      }

      localStorage.setItem("token", data.access_token);

      const me = await getMe(data.access_token);

      if (me?.role === "admin") {
        router.replace("/dashboard/admin");
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) return null;

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
          <h1
            style={{
              marginTop: 0,
              marginBottom: "10px",
              color: "#0f172a",
              fontSize: "34px",
            }}
          >
            Connexion
          </h1>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            Connecte-toi pour accéder à ton dashboard et démarrer une session.
          </p>

          {error && (
            <Alert type="warning" style={{ marginBottom: "16px" }}>
              {error}
            </Alert>
          )}

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
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
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
              disabled={isLoading}
              fullWidth
              variant="blue"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div
            style={{
              marginTop: "18px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Pas encore de compte ?{" "}
            <span
              onClick={() => router.push("/auth/register")}
              style={{
                color: "#2563eb",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Créer un compte
            </span>
          </div>
        </Card>
      </main>
    </div>
  );
}