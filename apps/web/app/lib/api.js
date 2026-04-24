const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function parseJsonSafe(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function fetchJson(path, options = {}, defaultError = "Erreur API") {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    let message = defaultError;

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.msg) return item.msg;
          return JSON.stringify(item);
        })
        .join(" | ");
    } else if (data?.detail && typeof data.detail === "object") {
      message = JSON.stringify(data.detail);
    } else if (typeof data?.message === "string") {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function loginUser(payload) {
  return fetchJson(
    "/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Erreur de connexion"
  );
}

export async function registerUser(payload) {
  return fetchJson(
    "/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Erreur d'inscription"
  );
}

export async function getMe(token) {
  return fetchJson(
    "/me",
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer le profil"
  );
}

export async function getProfile(token) {
  return getMe(token);
}

export async function getScenarios(token) {
  return fetchJson(
    "/scenarios",
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer les scénarios"
  );
}

export async function startSession(token, scenarioId, durationSeconds = 900) {
  return fetchJson(
    "/sessions/start",
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        scenario_id: scenarioId,
        duration_seconds: durationSeconds,
      }),
    },
    "Impossible de démarrer la session"
  );
}
export async function getSessions(token) {
  return fetchJson(
    "/sessions",
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer les sessions"
  );
}

export async function getSessionById(token, sessionId) {
  return fetchJson(
    `/sessions/${sessionId}`,
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer la session"
  );
}

export async function sendSessionMessage(token, sessionId, content) {
  return fetchJson(
    `/sessions/${sessionId}/message`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    },
    "Impossible d'envoyer le message"
  );
}

export async function completeSession(token, sessionId) {
  return fetchJson(
    `/sessions/${sessionId}/complete`,
    {
      method: "PATCH",
      headers: authHeaders(token),
    },
    "Impossible de terminer la session"
  );
}

export async function getSessionFeedback(token, sessionId) {
  return fetchJson(
    `/sessions/${sessionId}/feedback`,
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer le feedback de la session"
  );
}

export async function getDashboardPerformance(token) {
  return fetchJson(
    "/dashboard/performance",
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer les statistiques de performance"
  );
}

export async function createScenario(token, payload) {
  return fetchJson(
    "/scenarios",
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
    "Impossible de créer le scénario"
  );
}

export async function sendVoiceMessage(token, sessionId, file) {
  const formData = new FormData();
  formData.append("audio", file);

  const response = await fetch(
    `${API_BASE_URL}/sessions/${sessionId}/voice-message`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    let message = "Impossible d'envoyer le message vocal";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.msg) return item.msg;
          return JSON.stringify(item);
        })
        .join(" | ");
    } else if (typeof data?.message === "string") {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}