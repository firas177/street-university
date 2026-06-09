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

export async function forgotPassword(email) {
  return fetchJson(
    "/auth/forgot-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    },
    "Impossible d'envoyer le lien de réinitialisation"
  );
}

export async function resetPassword(token, newPassword) {
  return fetchJson(
    "/auth/reset-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    },
    "Impossible de réinitialiser le mot de passe"
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

export async function getAdminAnalyticsSummary(token) {
  return fetchJson(
    "/admin/analytics/summary",
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer le résumé analytics admin"
  );
}

export async function getAdminAnalyticsUsers(
  token,
  sortBy = "average_score",
  order = "desc"
) {
  const params = new URLSearchParams();
  params.set("sort_by", sortBy || "average_score");
  params.set("order", order || "desc");

  return fetchJson(
    `/admin/analytics/users?${params.toString()}`,
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer la liste analytics utilisateurs"
  );
}

export async function askAdminAssistant(token, message) {
  return fetchJson(
    "/admin/assistant",
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ message }),
    },
    "Impossible d'interroger l'assistant admin"
  );
}

export async function getAdminUserProgress(token, userId) {
  return fetchJson(
    `/admin/analytics/users/${userId}/progress`,
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Impossible de récupérer la progression de cet utilisateur"
  );
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

export async function startSession(token, scenarioId, durationSeconds = 60) {
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

export async function uploadMyCV(token, file) {
  const formData = new FormData();
  formData.append("cv", file);

  const response = await fetch(`${API_BASE_URL}/me/cv/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    let message = "Impossible d'uploader le CV";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (typeof data?.message === "string") {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}

export async function getMyCV(token) {
  return fetchJson(
    "/me/cv",
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Aucun CV trouvé"
  );
}

export async function structureMyCV(token) {
  return fetchJson(
    "/me/cv/structure",
    {
      method: "POST",
      headers: authHeaders(token),
    },
    "Impossible de générer le profil CV"
  );
}

export async function getMyCVProfile(token) {
  return fetchJson(
    "/me/cv/profile",
    {
      method: "GET",
      headers: authHeaders(token),
    },
    "Profil CV structuré non généré"
  );
}

export async function deleteMyCV(token) {
  return fetchJson(
    "/me/cv",
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
    "Impossible de supprimer le CV"
  );
}


export async function deleteScenario(token, scenarioId) {
  const res = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.detail || "Erreur lors de la suppression du scénario");
  }

  return data;
}