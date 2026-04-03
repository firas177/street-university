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
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data?.detail || "Erreur profil");
  }

  return data;
}

export async function getScenarios(token) {
  const res = await fetch(`${API_URL}/scenarios`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data?.detail || "Erreur lors du chargement des scénarios");
  }

  return data;
}

export async function getScenarioById(token, scenarioId) {
  const res = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data?.detail || "Erreur lors du chargement du scénario");
  }

  return data;
}

export async function startSession(token, scenarioId) {
  const res = await fetch(`${API_URL}/sessions/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      scenario_id: scenarioId,
    }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data?.detail || "Erreur lors du démarrage de la session");
  }

  return data;
}

export async function getSessionById(token, sessionId) {
  const res = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data?.detail || "Erreur lors du chargement de la session");
  }

  return data;
}

export async function sendSessionMessage(token, sessionId, content) {
  const res = await fetch(`${API_URL}/sessions/${sessionId}/message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data?.detail || "Erreur lors de l’envoi du message");
  }

  return data;
}