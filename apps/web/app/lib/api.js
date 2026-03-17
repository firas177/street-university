const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function formatError(data) {
  if (!data) return "Erreur inconnue";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return JSON.stringify(data.detail);
  return JSON.stringify(data);
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(`${res.status} ${formatError(data)}`);
  }

  return data;
}

export async function registerUser({ full_name, email, password }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ full_name, email, password }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(`${res.status} ${formatError(data)}`);
  }

  return data;
}

export async function getProfile(token) {
  const res = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(`${res.status} ${formatError(data)}`);
  }

  return data;
}