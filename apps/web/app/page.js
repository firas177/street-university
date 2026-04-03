"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import PageHeader from "./components/ui/PageHeader";

export default function HomePage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setHasToken(!!token);
    setMounted(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setHasToken(false);
    router.replace("/");
  }

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        <PageHeader
          dark
          badge="Street University"
          title="Bienvenue"
          description="Entraîne-toi avec des simulations IA pour développer tes soft skills."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginTop: "24px",
          }}
        >
          <Card
            style={{
              borderRadius: "22px",
              padding: "22px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#0f172a",
                fontSize: "24px",
              }}
            >
              Notre mission
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: 1.7,
                marginBottom: "18px",
              }}
            >
              Street University aide les jeunes à progresser dans des situations
              réelles comme l’entretien d’embauche, le pitch investisseur, la
              négociation et la prise de parole.
            </p>

            {hasToken ? (
              <Button onClick={() => router.push("/scenarios")} fullWidth variant="blue">
                Continuer
              </Button>
            ) : (
              <Button onClick={() => router.push("/auth/login")} fullWidth variant="blue">
                Commencer
              </Button>
            )}
          </Card>

          <Card
            style={{
              borderRadius: "22px",
              padding: "22px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#0f172a",
                fontSize: "24px",
              }}
            >
              Ce que tu peux faire
            </h2>

            <ul
              style={{
                color: "#475569",
                lineHeight: 1.9,
                paddingLeft: "18px",
                marginBottom: "18px",
              }}
            >
              <li>Choisir un scénario</li>
              <li>Démarrer une vraie session</li>
              <li>Discuter avec l’assistant IA</li>
              <li>Améliorer tes réponses</li>
            </ul>

            {hasToken ? (
              <Button onClick={handleLogout} fullWidth variant="danger">
                Déconnexion
              </Button>
            ) : (
              <Button onClick={() => router.push("/auth/login")} fullWidth>
                Se connecter
              </Button>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}