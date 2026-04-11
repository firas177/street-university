import os
import json
from typing import List, Dict, Any
import requests

AI_API_KEY = os.getenv("AI_API_KEY")
AI_API_URL = os.getenv("AI_API_URL", "https://api.groq.com/openai/v1/chat/completions")
AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")


def build_messages(
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
) -> List[Dict[str, str]]:
    messages = [{"role": "system", "content": system_prompt}]

    for msg in history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    messages.append({"role": "user", "content": user_message})
    return messages


def generate_ai_reply(
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
) -> str:
    if not AI_API_KEY:
        return "Clé API IA absente."

    messages = build_messages(system_prompt, history, user_message)

    payload = {
        "model": AI_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 500
    }

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(AI_API_URL, json=payload, headers=headers, timeout=60)

    if response.status_code != 200:
        return f"Erreur IA: {response.status_code} - {response.text}"

    data = response.json()
    return data["choices"][0]["message"]["content"]


def _default_feedback(
    strengths: str = "Feedback indisponible.",
    weaknesses: str = "Impossible d'analyser cette session.",
    final_advice: str = "Réessayez après avoir complété davantage la simulation.",
) -> Dict[str, Any]:
    return {
        "overall_score": None,
        "communication_score": None,
        "confidence_score": None,
        "clarity_score": None,
        "relevance_score": None,
        "professionalism_score": None,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "final_advice": final_advice,
    }


def _safe_score(value: Any) -> float | None:
    if value is None:
        return None

    try:
        score = float(value)
    except (TypeError, ValueError):
        return None

    if score < 0:
        score = 0.0
    if score > 10:
        score = 10.0

    return round(score, 1)


def _normalize_feedback(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "overall_score": _safe_score(raw.get("overall_score")),
        "communication_score": _safe_score(raw.get("communication_score")),
        "confidence_score": _safe_score(raw.get("confidence_score")),
        "clarity_score": _safe_score(raw.get("clarity_score")),
        "relevance_score": _safe_score(raw.get("relevance_score")),
        "professionalism_score": _safe_score(raw.get("professionalism_score")),
        "strengths": str(raw.get("strengths") or "Aucun point fort fourni."),
        "weaknesses": str(raw.get("weaknesses") or "Aucun axe d'amélioration fourni."),
        "final_advice": str(raw.get("final_advice") or "Aucun conseil final fourni."),
    }


def generate_session_feedback(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    if not AI_API_KEY:
        return _default_feedback(
            strengths="Clé API IA absente.",
            weaknesses="Impossible de générer une évaluation automatique.",
            final_advice="Configurer l'API IA pour activer le rating réel.",
        )

    if not messages:
        return _default_feedback(
            strengths="Aucun contenu de session.",
            weaknesses="La session ne contient pas encore de messages exploitables.",
            final_advice="Complétez la session avant de demander une évaluation.",
        )

    system_prompt = (
        "Tu es un évaluateur professionnel de simulations de soft skills. "
        "Analyse la conversation fournie entre l'utilisateur et l'assistant. "
        "Retourne uniquement un JSON valide, sans texte avant ni après. "
        "Évalue la qualité globale de la prestation de l'utilisateur. "
        "Les scores doivent être des nombres entre 0 et 10, avec possibilité de décimales. "
        "Le JSON doit respecter exactement ce format : "
        "{"
        "\"overall_score\": 0,"
        "\"communication_score\": 0,"
        "\"confidence_score\": 0,"
        "\"clarity_score\": 0,"
        "\"relevance_score\": 0,"
        "\"professionalism_score\": 0,"
        "\"strengths\": \"...\"," 
        "\"weaknesses\": \"...\"," 
        "\"final_advice\": \"...\""
        "} "
        "Ne mets aucune clé supplémentaire."
    )

    conversation_text = "\n".join(
        [f"{msg['role']}: {msg['content']}" for msg in messages]
    )

    payload = {
        "model": AI_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    "Voici la conversation à évaluer.\n\n"
                    f"{conversation_text}\n\n"
                    "Retourne uniquement le JSON demandé."
                ),
            },
        ],
        "temperature": 0.2,
        "max_tokens": 700,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(AI_API_URL, json=payload, headers=headers, timeout=90)
    except requests.RequestException as exc:
        return _default_feedback(
            strengths="Erreur réseau pendant l'évaluation.",
            weaknesses=str(exc),
            final_advice="Réessayez plus tard.",
        )

    if response.status_code != 200:
        return _default_feedback(
            strengths=f"Erreur IA: {response.status_code}",
            weaknesses=response.text[:1000],
            final_advice="Réessayez plus tard ou vérifiez la configuration du provider IA.",
        )

    try:
        data = response.json()
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        return _default_feedback(
            strengths="Réponse IA reçue.",
            weaknesses=f"Structure de réponse invalide: {exc}",
            final_advice="Vérifiez le format de réponse du provider IA.",
        )

    try:
        parsed = json.loads(content)
    except Exception:
        return _default_feedback(
            strengths="Réponse IA reçue.",
            weaknesses="Le contenu retourné n'est pas un JSON valide.",
            final_advice=content[:500] if content else "Aucun contenu exploitable.",
        )

    return _normalize_feedback(parsed)