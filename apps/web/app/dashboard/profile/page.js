"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "../../lib/api";


export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/auth/login");
          return;
        }

        const data = await getProfile(token);
        setUser(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Impossible de charger le profil");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  if (loading) return <div style={{ padding: 40 }}>Chargement...</div>;
  if (error) return <div style={{ padding: 40, color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard Profil</h1>
      <p><strong>Nom :</strong> {user.full_name}</p>
      <p><strong>Email :</strong> {user.email}</p>
      <p><strong>ID :</strong> {user.id}</p>
    </div>
  );
}