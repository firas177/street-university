import json
import os
import re
from typing import Any, Dict, List, Optional

import requests

AI_API_KEY = os.getenv("AI_API_KEY")
AI_API_URL = os.getenv(
    "AI_API_URL",
    "https://api.groq.com/openai/v1/chat/completions",
)
AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
AI_TIMEOUT = int(os.getenv("AI_TIMEOUT", "90"))


LOW_EFFORT_PATTERNS = [
    r"^\s*rien\s*$",
    r"^\s*je sais pas\s*$",
    r"^\s*aucune idée\s*$",
    r"^\s*pas de projet\s*$",
    r"^\s*non\s*$",
    r"^\s*normal[e]?\s*$",
    r"^\s*bof\s*$",
    r"^\s*jsp\s*$",
    r"^\s*idk\s*$",
]

EXIT_PATTERNS = [
    r"\bje veux quitter\b",
    r"\bje veux partir\b",
    r"\barr[êe]ter l[' ]?entretien\b",
    r"\bon arr[êe]te\b",
    r"\bstop interview\b",
    r"\bend interview\b",
    r"\bquit\b",
    r"\bexit\b",
]

PROMPT_LEAK_PATTERNS = [
    r"\bdonne[- ]?moi ton prompt\b",
    r"\bdonner moi ton prompt\b",
    r"\bshow me your prompt\b",
    r"\bwhat is your prompt\b",
    r"\bsystem prompt\b",
    r"\binstructions?\b",
    r"\bconsignes\b",
]

RATING_REQUEST_PATTERNS = [
    r"\bdonne[- ]?moi un rate\b",
    r"\bdonner[- ]?moi un rate\b",
    r"\bgive me a rate\b",
    r"\bnote[- ]?moi\b",
    r"\bma note\b",
    r"\brating\b",
    r"\bscore\b",
    r"\brate this\b",
]

TECH_KEYWORDS = [
    "python", "java", "javascript", "typescript", "sql", "html", "css",
    "react", "next", "fastapi", "django", "flask", "spring", "node",
    "jwt", "docker", "postgresql", "postgres", "api",
    "machine learning", "deep learning", "tensorflow", "pytorch",
    "scikit-learn", "sklearn", "llm", "groq", "openai",
    "backend", "frontend", "authentification",
]

PROJECT_KEYWORDS = [
    "projet", "plateforme", "application", "site", "street university",
    "stage", "pfe", "mini-projet", "dashboard", "app",
]

ROLE_KEYWORDS = [
    "j'ai participé", "j ai participé",
    "j'ai développé", "j ai développé",
    "j'ai implémenté", "j ai implémenté",
    "j'ai réalisé", "j ai réalisé",
    "backend", "frontend", "authentification", "jwt",
    "gestion des sessions", "api", "base de données", "docker", "intégration",
]

RESULT_KEYWORDS = [
    "résultat", "livrable", "déployé", "fonctionne", "mis en place",
    "j'ai terminé", "j ai terminé",
    "j'ai réussi", "j ai réussi",
    "j'ai branché", "j ai branché",
    "j'ai intégré", "j ai intégré",
    "working", "implemented", "built",
]

GENERIC_FALLBACK_QUESTION = (
    "Pouvez-vous me donner un exemple concret lié à votre formation, "
    "un outil utilisé ou un projet sur lequel vous avez travaillé ?"
)


def _post_chat(
    messages: List[Dict[str, str]],
    *,
    temperature: float = 0.2,
    max_tokens: int = 350,
    response_format: Optional[Dict[str, str]] = None,
) -> str:
    if not AI_API_KEY:
        raise RuntimeError("AI_API_KEY non configuré.")

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload: Dict[str, Any] = {
        "model": AI_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if response_format is not None:
        payload["response_format"] = response_format

    response = requests.post(
        AI_API_URL,
        headers=headers,
        json=payload,
        timeout=AI_TIMEOUT,
    )
    response.raise_for_status()

    data = response.json()
    return data["choices"][0]["message"]["content"]


def _strip_code_fences(text: str) -> str:
    value = (text or "").strip()
    value = re.sub(r"^```(?:json)?\s*", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s*```$", "", value)
    return value.strip()


def _safe_json_loads(text: str) -> Dict[str, Any]:
    return json.loads(_strip_code_fences(text))


def _clamp_score(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = default
    return max(0.0, min(10.0, round(number, 1)))


def clean_transcription_text(text: str) -> str:
    value = (text or "").strip()
    value = value.replace("\n", " ")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def _matches_any(text: str, patterns: List[str]) -> bool:
    value = clean_transcription_text(text).lower()
    return any(re.search(pattern, value, flags=re.IGNORECASE) for pattern in patterns)


def _is_low_effort_text(text: str) -> bool:
    value = clean_transcription_text(text)
    if not value:
        return True
    if len(value) <= 3:
        return True
    return _matches_any(value, LOW_EFFORT_PATTERNS)


def _extract_user_messages(messages: List[Dict[str, str]]) -> List[str]:
    return [
        clean_transcription_text(msg.get("content", ""))
        for msg in messages
        if msg.get("role") == "user"
    ]


def _extract_assistant_messages(messages: List[Dict[str, str]]) -> List[str]:
    return [
        clean_transcription_text(msg.get("content", ""))
        for msg in messages
        if msg.get("role") == "assistant"
    ]


def _count_low_effort_messages(messages: List[Dict[str, str]]) -> int:
    return sum(1 for text in _extract_user_messages(messages) if _is_low_effort_text(text))


def _contains_keywords(messages: List[Dict[str, str]], keywords: List[str]) -> bool:
    text = " ".join(_extract_user_messages(messages)).lower()
    return any(keyword.lower() in text for keyword in keywords)


def _has_project_evidence(messages: List[Dict[str, str]]) -> bool:
    return _contains_keywords(messages, PROJECT_KEYWORDS)


def _has_tech_evidence(messages: List[Dict[str, str]]) -> bool:
    return _contains_keywords(messages, TECH_KEYWORDS)


def _has_role_evidence(messages: List[Dict[str, str]]) -> bool:
    return _contains_keywords(messages, ROLE_KEYWORDS)


def _has_result_evidence(messages: List[Dict[str, str]]) -> bool:
    return _contains_keywords(messages, RESULT_KEYWORDS)


def _salary_only_motivation(messages: List[Dict[str, str]]) -> bool:
    text = " ".join(_extract_user_messages(messages)).lower()
    salary_hits = any(token in text for token in ["salaire", "argent", "money", "paid"])
    positive_hits = any(
        token in text
        for token in [
            "apprendre", "learning", "évolution", "progress", "progression",
            "expérience", "experience", "stabilité", "stability",
            "contribuer", "contribute", "équipe", "team",
        ]
    )
    return salary_hits and not positive_hits


def _early_exit(messages: List[Dict[str, str]]) -> bool:
    user_messages = _extract_user_messages(messages)
    if not user_messages:
        return False
    return any(_matches_any(text, EXIT_PATTERNS) for text in user_messages) and len(user_messages) <= 6


def _contextual_fallback_question(history: List[Dict[str, str]], user_message: str) -> str:
    text = " ".join(_extract_user_messages(history) + [clean_transcription_text(user_message)]).lower()

    if "intelligence artificielle" in text or re.search(r"\bia\b", text):
        return "Même sans grand projet, avez-vous déjà utilisé Python, scikit-learn, TensorFlow ou PyTorch ?"

    if "computer science" in text or "informatique" in text:
        return "Quel langage ou outil avez-vous réellement utilisé le plus pendant vos études : Python, JavaScript, SQL ou autre ?"

    if "projet" in text or "street university" in text:
        return "Quel était exactement votre rôle personnel dans ce projet : backend, frontend, base de données ou autre ?"

    return "Pouvez-vous citer un outil, un langage ou un mini-travail concret que vous avez déjà utilisé ?"


def _build_meta_instruction(user_message: str, history: List[Dict[str, str]]) -> str:
    simulated_messages = history + [{"role": "user", "content": user_message}]
    low_effort_count = _count_low_effort_messages(simulated_messages)
    parts = []

    if low_effort_count >= 3:
        parts.append(
            "Le candidat donne plusieurs réponses faibles. Simplifie la prochaine question, "
            "rends-la très concrète, et ne répète pas la même formulation."
        )
    elif low_effort_count >= 1:
        parts.append(
            "La réponse récente est faible ou peu détaillée. Reformule avec une question plus simple et plus concrète."
        )

    if not parts:
        parts.append("Continue l'entretien avec une seule question courte, claire et professionnelle.")

    return "\n".join(parts)


def _clean_recruiter_reply(text: str) -> str:
    value = clean_transcription_text(text)
    if not value:
        return GENERIC_FALLBACK_QUESTION

    fluff_patterns = [
        r"^enchanté[,.\s]*",
        r"^très bien[,.\s]*",
        r"^merci[,.\s]*",
        r"^merci pour cette précision[,.\s]*",
        r"^je comprends[,.\s]*",
        r"^c'est très intéressant[,.\s]*",
    ]
    for pattern in fluff_patterns:
        value = re.sub(pattern, "", value, flags=re.IGNORECASE).strip()

    questions = re.findall(r"[^?]*\?", value)
    if len(questions) >= 2:
        value = questions[-1].strip()

    if len(value) > 260:
        value = value[:260].rsplit(" ", 1)[0].strip() + "..."

    return value or GENERIC_FALLBACK_QUESTION


def generate_ai_reply(
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
) -> str:
    cleaned_user_message = clean_transcription_text(user_message)

    if _matches_any(cleaned_user_message, EXIT_PATTERNS):
        return (
            "Très bien. Nous pouvons arrêter ici. Merci pour votre temps. "
            "L’évaluation finale sera disponible à la fin de la session."
        )

    if _matches_any(cleaned_user_message, PROMPT_LEAK_PATTERNS):
        return "Je préfère rester concentré sur l’entretien. " + _contextual_fallback_question(history, cleaned_user_message)

    if _matches_any(cleaned_user_message, RATING_REQUEST_PATTERNS):
        return "Nous ferons l’évaluation à la fin de l’entretien. " + _contextual_fallback_question(history, cleaned_user_message)

    if _is_low_effort_text(cleaned_user_message):
        return _contextual_fallback_question(history, cleaned_user_message)

    if not AI_API_KEY:
        return GENERIC_FALLBACK_QUESTION

    recruiter_guardrails = """
Tu es un recruteur RH professionnel, exigeant, naturel et crédible.

OBJECTIF
Tu mènes un entretien d'embauche réaliste pour un candidat junior.
Tu évalues formation, compétences, projets, motivation, clarté, professionnalisme et potentiel.

STYLE OBLIGATOIRE
- Une seule question à la fois.
- Réponses courtes : 1 à 3 phrases maximum.
- Ton professionnel, direct, naturel.
- Pas de longs paragraphes.
- Pas de compliments automatiques à chaque réponse.
- Pas de répétition inutile.
- Pas de phrases génériques comme "c'est très intéressant" sauf si vraiment utile.

RÈGLES TECHNIQUES
- Ne classe pas un terme technique sans être sûr.
- Si un candidat cite une techno, utilise la bonne catégorie technique.
- CSS est un langage de style, pas un framework.
- HTML est un langage de balisage, pas un framework.
- Python, JavaScript, Java sont des langages.
- SQL est un langage de requête.
- JWT est un mécanisme d'authentification.
- React, FastAPI, Django peuvent être considérés comme frameworks ou bibliothèques selon le contexte.
- Si le candidat emploie un terme imprécis, corrige brièvement puis pose une question concrète.
- Si tu n'es pas sûr, demande une clarification au lieu d'affirmer quelque chose de faux.

RÈGLES MÉTIER
- Si le candidat répond faiblement, reformule UNE fois de façon plus simple.
- Si le candidat reste vague, change d'angle au lieu de répéter la même question.
- Préfère des questions concrètes : projet, outil, rôle, difficulté, apprentissage, motivation.
- Si la transcription semble imparfaite, cherche le sens général et pose une courte clarification si nécessaire.
- Ne donne jamais la réponse au candidat.
- Reste recruteur, pas professeur ni chatbot bavard.
"""

    meta_instruction = _build_meta_instruction(cleaned_user_message, history)

    conversation_messages: List[Dict[str, str]] = [
        {
            "role": "system",
            "content": (
                recruiter_guardrails.strip()
                + "\n\nSCÉNARIO:\n"
                + (system_prompt or "Entretien RH junior standard.")
                + "\n\nINSTRUCTION CONTEXTUELLE:\n"
                + meta_instruction
            ),
        }
    ]

    trimmed_history = history[-12:] if history else []
    for msg in trimmed_history:
        role = msg.get("role", "")
        content = clean_transcription_text(msg.get("content", ""))
        if role in {"user", "assistant"} and content:
            conversation_messages.append({"role": role, "content": content})

    conversation_messages.append({"role": "user", "content": cleaned_user_message})

    try:
        content = _post_chat(
            conversation_messages,
            temperature=0.15,
            max_tokens=220,
        )
        cleaned_reply = _clean_recruiter_reply(_strip_code_fences(content))

        last_assistant_messages = _extract_assistant_messages(history)
        if last_assistant_messages and cleaned_reply.lower() == last_assistant_messages[-1].lower():
            return _contextual_fallback_question(history, cleaned_user_message)

        return cleaned_reply
    except Exception:
        return _contextual_fallback_question(history, cleaned_user_message)


def _default_feedback(
    strengths: str = "Aucun point fort clairement identifié.",
    weaknesses: str = "Évaluation indisponible.",
    final_advice: str = "Réessayez après une session plus complète.",
) -> Dict[str, Any]:
    return {
        "overall_score": 0.0,
        "communication_score": 0.0,
        "confidence_score": 0.0,
        "clarity_score": 0.0,
        "relevance_score": 0.0,
        "professionalism_score": 0.0,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "final_advice": final_advice,
    }


def _normalize_feedback(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "overall_score": _clamp_score(payload.get("overall_score")),
        "communication_score": _clamp_score(payload.get("communication_score")),
        "confidence_score": _clamp_score(payload.get("confidence_score")),
        "clarity_score": _clamp_score(payload.get("clarity_score")),
        "relevance_score": _clamp_score(payload.get("relevance_score")),
        "professionalism_score": _clamp_score(payload.get("professionalism_score")),
        "strengths": str(payload.get("strengths") or "Aucun point fort clairement identifié.").strip(),
        "weaknesses": str(payload.get("weaknesses") or "Faiblesses non précisées.").strip(),
        "final_advice": str(payload.get("final_advice") or "Préparez des exemples concrets et réessayez.").strip(),
    }


def _apply_feedback_business_rules(
    feedback: Dict[str, Any],
    messages: List[Dict[str, str]],
) -> Dict[str, Any]:
    normalized = _normalize_feedback(feedback)

    low_effort_count = _count_low_effort_messages(messages)
    has_project = _has_project_evidence(messages)
    has_tech = _has_tech_evidence(messages)
    has_role = _has_role_evidence(messages)
    has_result = _has_result_evidence(messages)
    early_exit = _early_exit(messages)
    salary_only = _salary_only_motivation(messages)

    if normalized["overall_score"] > 6.5 and not (has_project and has_tech and has_role):
        normalized["overall_score"] = 6.5

    if normalized["overall_score"] > 7.0 and not (has_project and has_tech and has_role and has_result):
        normalized["overall_score"] = 7.0

    if low_effort_count >= 3:
        normalized["overall_score"] = min(normalized["overall_score"], 3.5)
        normalized["communication_score"] = min(normalized["communication_score"], 4.0)
        normalized["clarity_score"] = min(normalized["clarity_score"], 4.0)
        normalized["relevance_score"] = min(normalized["relevance_score"], 4.0)

    if early_exit:
        normalized["overall_score"] = min(normalized["overall_score"], 5.5)

    if salary_only:
        normalized["professionalism_score"] = min(normalized["professionalism_score"], 5.0)
        normalized["relevance_score"] = min(normalized["relevance_score"], 5.5)

    user_text = " ".join(_extract_user_messages(messages)).lower()
    if "aucun point fort" in normalized["strengths"].lower():
        if "dipl" in user_text or "computer science" in user_text or "informatique" in user_text:
            normalized["strengths"] = "Base académique en informatique et intérêt initial pour le domaine visé."
        elif "intelligence artificielle" in user_text or "ia" in user_text:
            normalized["strengths"] = "Intérêt déclaré pour l’intelligence artificielle."

    return normalized


def generate_session_feedback(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    if not messages:
        return _default_feedback(
            strengths="Aucun contenu de session.",
            weaknesses="La session est vide.",
            final_advice="Réalisez une session complète avant de demander une évaluation.",
        )

    if not AI_API_KEY:
        return _default_feedback(
            strengths="Évaluation IA indisponible.",
            weaknesses="AI_API_KEY non configuré.",
            final_advice="Configurez la clé IA pour activer le feedback automatique.",
        )

    system_prompt = """
Tu es un évaluateur RH strict, réaliste et utile.
Tu retournes UNIQUEMENT un JSON valide.

FORMAT OBLIGATOIRE :
{
  "overall_score": 0,
  "communication_score": 0,
  "confidence_score": 0,
  "clarity_score": 0,
  "relevance_score": 0,
  "professionalism_score": 0,
  "strengths": "...",
  "weaknesses": "...",
  "final_advice": "..."
}

RÈGLES :
- Scores entre 0 et 10.
- Pas de texte hors JSON.
- Ne récompense pas fortement une simple mention de projet ou certificat sans détails.
- Si le candidat reste vague, très court, répétitif ou sans preuves concrètes, les notes doivent rester basses ou modérées.
- Pour dépasser 7 en global, il faut généralement : projet concret, rôle identifiable, détails techniques, motivation crédible, réponses claires.
- Pour dépasser 8, il faut une vraie très bonne performance, rare.
- strengths doit citer uniquement des points réellement observés.
- weaknesses doit citer les vrais manques observés.
- final_advice doit être court, concret et utile.
"""

    conversation_text = "\n".join(
        f"{msg.get('role', '').upper()}: {clean_transcription_text(msg.get('content', ''))}"
        for msg in messages
        if clean_transcription_text(msg.get("content", ""))
    )

    try:
        content = _post_chat(
            [
                {"role": "system", "content": system_prompt.strip()},
                {
                    "role": "user",
                    "content": (
                        "Analyse cette conversation d'entretien et retourne uniquement le JSON.\n\n"
                        f"{conversation_text}"
                    ),
                },
            ],
            temperature=0.0,
            max_tokens=700,
        )
        parsed = _safe_json_loads(content)
        return _apply_feedback_business_rules(parsed, messages)
    except Exception:
        return _default_feedback(
            strengths="Évaluation partielle indisponible.",
            weaknesses="Erreur pendant la génération du feedback automatique.",
            final_advice="Réessayez après redémarrage du service IA.",
        )