"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../lib/api";

function EyeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5.2 5.2C3.3 6.7 2 8.7 2 12c0 0 3.5 7 10 7 2 0 3.7-.6 5.1-1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.3 8.3C9.4 7.5 10.7 7 12 7c6.5 0 10 5 10 5s-1.1 2.2-3.3 3.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser({ email, password });
      localStorage.setItem("token", data.access_token);
      router.push("/dashboard/profile");
    } catch (err) {
      setError(err?.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 30%, #f8fafc 70%, #ffffff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(10px)",
          borderRadius: "28px",
          padding: "34px",
          boxShadow: "0 25px 60px rgba(15,23,42,0.12)",
          border: "1px solid rgba(226,232,240,0.9)",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: "999px",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: "13px",
              fontWeight: "700",
              marginBottom: "16px",
            }}
          >
            Street University
          </div>

          <h1
            style={{
              fontSize: "44px",
              margin: 0,
              fontWeight: "800",
              color: "#0f172a",
              lineHeight: 1.05,
            }}
          >
            Connexion
          </h1>

          <p style={{ marginTop: "12px", color: "#64748b", fontSize: "16px", lineHeight: 1.5 }}>
            Connecte-toi pour accéder à ton espace et poursuivre ton parcours.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="ex: test@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "15px 16px",
                borderRadius: "16px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                outline: "none",
                fontSize: "15px",
                transition: "0.2s",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              Mot de passe
            </label>

            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "15px 52px 15px 16px",
                  borderRadius: "16px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  outline: "none",
                  fontSize: "15px",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                padding: "13px 14px",
                borderRadius: "14px",
                fontSize: "14px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
              padding: "15px",
              borderRadius: "16px",
              border: "none",
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              color: "#ffffff",
              fontWeight: "800",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 12px 24px rgba(15,23,42,0.18)",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p style={{ marginTop: "20px", color: "#64748b", fontSize: "14px" }}>
          Pas de compte ?
          <a
            href="/auth/register"
            style={{
              color: "#2563eb",
              fontWeight: "700",
              marginLeft: "6px",
              textDecoration: "none",
            }}
          >
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
}