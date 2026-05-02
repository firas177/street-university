import os
import re
from typing import Any


MODEL_NAME = "lxyuan/distilbert-base-multilingual-cased-sentiments-student"

_sentiment_pipeline = None


# Si le modèle donne une confiance faible, on ne lui fait pas confiance directement.
# On passe par le fallback.
MODEL_CONFIDENCE_THRESHOLD = float(
    os.getenv("SENTIMENT_CONFIDENCE_THRESHOLD", "0.70")
)


POSITIVE_WORDS = {
    # English
    "good",
    "great",
    "excellent",
    "confident",
    "clear",
    "ready",
    "motivated",
    "passionate",
    "strong",
    "comfortable",
    "success",
    "successful",
    "improved",
    "organized",
    "learned",
    "i learned",
    "capable",
    "skilled",

    # French
    "bien",
    "excellent",
    "motivé",
    "motivée",
    "motivation",
    "confiant",
    "confiante",
    "clair",
    "claire",
    "prêt",
    "prête",
    "fort",
    "forte",
    "réussi",
    "réussie",
    "j’ai appris",
    "j'ai appris",
    "appris",
    "amélioré",
    "ameliore",
    "améliorée",
    "progressé",
    "progressée",
    "maîtrise",
    "maitrise",
    "capable",
    "compétent",
    "compétente",
}


NEGATIVE_WORDS = {
    # English
    "bad",
    "weak",
    "problem",
    "failed",
    "fail",
    "stress",
    "stressed",
    "confused",
    "nervous",
    "afraid",
    "not sure",
    "don't know",
    "i don't know",
    "cannot",
    "can't",
    "i cannot",
    "i can't",
    "i do not understand",
    "i don't understand",
    "lack of confidence",

    # French
    "mauvais",
    "mauvaise",
    "faible",
    "problème",
    "probleme",
    "stress",
    "stressé",
    "stressée",
    "nerveux",
    "nerveuse",
    "peur",
    "je ne sais pas",
    "je sais pas",
    "pas sûr",
    "pas sûre",
    "je ne comprends pas",
    "je comprends pas",
    "pas compris",
    "je n’ai pas compris",
    "je n'ai pas compris",
    "manque de confiance",
    "bloqué",
    "bloquée",
    "confus",
    "confuse",
}


HESITATION_PATTERNS = [
    r"\buh\b",
    r"\bum\b",
    r"\beuh\b",
    r"\behm\b",
    r"\bhmm\b",
    r"\bje sais pas\b",
    r"\bje ne sais pas\b",
    r"\bpas sûr\b",
    r"\bpas sûre\b",
    r"\bnot sure\b",
    r"\bi don't know\b",
]


def _normalize(text: str) -> str:
    return (text or "").lower().strip()


def _contains_phrase(text: str, phrase: str) -> bool:
    normalized = _normalize(text)
    phrase = _normalize(phrase)

    if not phrase:
        return False

    return phrase in normalized


def _count_keyword_matches(text: str, keywords: set[str]) -> int:
    normalized = _normalize(text)
    count = 0

    for keyword in keywords:
        if _contains_phrase(normalized, keyword):
            count += 1

    return count


def _count_hesitations(text: str) -> int:
    normalized = _normalize(text)
    count = 0

    for pattern in HESITATION_PATTERNS:
        count += len(re.findall(pattern, normalized, flags=re.IGNORECASE))

    return count


def _has_learning_contrast(text: str) -> bool:
    """
    Exemple :
    "Ce projet était difficile mais j’ai beaucoup appris."
    Cette phrase contient un mot négatif, mais elle montre une progression.
    Donc on évite de la classer négative.
    """
    normalized = _normalize(text)

    positive_learning_signals = [
        "mais j’ai appris",
        "mais j'ai appris",
        "mais nous avons appris",
        "but i learned",
        "but we learned",
        "j’ai beaucoup appris",
        "j'ai beaucoup appris",
        "i learned a lot",
    ]

    return any(signal in normalized for signal in positive_learning_signals)


def _fallback_sentiment(text: str) -> dict[str, Any]:
    normalized = _normalize(text)

    if not normalized:
        return {
            "label": "neutral",
            "score": 0.0,
            "confidence": 0.0,
            "summary": "Aucun contenu analysable.",
            "provider": "fallback",
            "model": "keyword-rules",
        }

    positive_count = _count_keyword_matches(normalized, POSITIVE_WORDS)
    negative_count = _count_keyword_matches(normalized, NEGATIVE_WORDS)
    hesitation_count = _count_hesitations(normalized)

    # Cas spécial : phrase mature du type "difficile mais j’ai appris"
    if _has_learning_contrast(normalized):
        positive_count += 2
        negative_count = max(0, negative_count - 1)

    raw_score = positive_count - negative_count - (0.5 * hesitation_count)

    if raw_score > 0:
        label = "positive"
    elif raw_score < 0:
        label = "negative"
    else:
        label = "neutral"

    total_signals = positive_count + negative_count + hesitation_count

    if total_signals == 0:
        score = 0.0
        confidence = 0.35
    else:
        score = max(-1.0, min(1.0, raw_score / max(total_signals, 1)))
        confidence = min(0.95, 0.45 + total_signals * 0.12)

    return {
        "label": label,
        "score": round(score, 2),
        "confidence": round(confidence, 2),
        "summary": (
            f"Sentiment détecté avec fallback: {label}. "
            f"Signaux positifs: {positive_count}, "
            f"signaux négatifs: {negative_count}, "
            f"hésitations: {hesitation_count}."
        ),
        "provider": "fallback",
        "model": "keyword-rules",
    }


def _load_pipeline():
    """
    Charge le modèle une seule fois.
    Si Torch ou le modèle ne sont pas disponibles, on retourne None.
    """
    global _sentiment_pipeline

    if _sentiment_pipeline is not None:
        return _sentiment_pipeline

    enable_transformer = os.getenv("ENABLE_TRANSFORMER_SENTIMENT", "true").lower()

    if enable_transformer not in {"true", "1", "yes"}:
        return None

    try:
        from transformers import pipeline

        _sentiment_pipeline = pipeline(
            task="text-classification",
            model=MODEL_NAME,
        )

        return _sentiment_pipeline

    except Exception as exc:
        print(
            "[sentiment] Transformer model not available, using fallback. "
            f"Error: {exc}"
        )
        return None


def _normalize_transformer_result(result: Any) -> dict[str, Any]:
    """
    La pipeline Hugging Face peut retourner :
    [{"label": "positive", "score": 0.93}]
    ou parfois [[{"label": "...", "score": ...}]]
    """

    if isinstance(result, list) and result and isinstance(result[0], list):
        scores = result[0]
    elif isinstance(result, list):
        scores = result
    else:
        scores = []

    if not scores:
        return {
            "label": "neutral",
            "score": 0.0,
            "confidence": 0.0,
        }

    best = max(scores, key=lambda item: float(item.get("score", 0.0)))

    label = str(best.get("label", "neutral")).lower()
    confidence = float(best.get("score", 0.0))

    label_to_score = {
        "positive": 1.0,
        "neutral": 0.0,
        "negative": -1.0,
    }

    if label not in label_to_score:
        label = "neutral"

    return {
        "label": label,
        "score": label_to_score.get(label, 0.0),
        "confidence": round(confidence, 2),
    }


def analyze_text_sentiment(text: str) -> dict[str, Any]:
    """
    Analyse sentimentale hybride :
    1. Essaye DistilBERT multilingue.
    2. Si le modèle est absent ou peu confiant, utilise fallback.
    3. Si aucun signal clair, retourne neutral.

    Labels :
    - positive
    - neutral
    - negative

    score :
    - positive = 1.0
    - neutral = 0.0
    - negative = -1.0
    """

    clean_text = (text or "").strip()

    if not clean_text:
        return {
            "label": "neutral",
            "score": 0.0,
            "confidence": 0.0,
            "summary": "Aucun contenu analysable.",
            "provider": "none",
            "model": None,
        }

    classifier = _load_pipeline()

    if classifier is None:
        return _fallback_sentiment(clean_text)

    try:
        result = classifier(clean_text[:512])
        normalized = _normalize_transformer_result(result)

        # Si le modèle est peu confiant, on ne l'accepte pas directement.
        if normalized["confidence"] < MODEL_CONFIDENCE_THRESHOLD:
            fallback = _fallback_sentiment(clean_text)

            if fallback["confidence"] <= 0.35:
                return {
                    "label": "neutral",
                    "score": 0.0,
                    "confidence": normalized["confidence"],
                    "summary": (
                        "Le modèle Transformer a donné une prédiction faible "
                        f"({normalized['label']} avec confiance "
                        f"{normalized['confidence']}). "
                        "Aucun signal clair détecté par fallback. "
                        "Le sentiment est donc considéré comme neutral."
                    ),
                    "provider": "hybrid_transformer_fallback",
                    "model": MODEL_NAME,
                }

            return {
                "label": fallback["label"],
                "score": fallback["score"],
                "confidence": fallback["confidence"],
                "summary": (
                    "Le modèle Transformer avait une confiance faible. "
                    f"Fallback utilisé. {fallback['summary']}"
                ),
                "provider": "hybrid_fallback",
                "model": f"{MODEL_NAME} + keyword-rules",
            }

        return {
            "label": normalized["label"],
            "score": normalized["score"],
            "confidence": normalized["confidence"],
            "summary": (
                "Sentiment détecté par modèle DistilBERT multilingue: "
                f"{normalized['label']} avec confiance "
                f"{normalized['confidence']}."
            ),
            "provider": "transformers",
            "model": MODEL_NAME,
        }

    except Exception as exc:
        print(
            "[sentiment] Transformer inference failed, using fallback. "
            f"Error: {exc}"
        )
        return _fallback_sentiment(clean_text)


def aggregate_voice_sentiments(messages: list) -> dict[str, Any]:
    """
    Agrège uniquement les messages utilisateur vocaux transcrits
    qui possèdent une analyse sentimentale.
    """

    analyzed = [
        msg
        for msg in messages
        if getattr(msg, "role", None) == "user"
        and getattr(msg, "sentiment_label", None)
        and getattr(msg, "sentiment_source", None) == "voice_transcription"
    ]

    if not analyzed:
        return {
            "label": None,
            "score": None,
            "summary": "Aucun message vocal analysé pour le sentiment.",
        }

    scores = [
        float(getattr(msg, "sentiment_score", 0.0) or 0.0)
        for msg in analyzed
    ]

    average_score = sum(scores) / len(scores)

    if average_score > 0.2:
        label = "positive"
    elif average_score < -0.2:
        label = "negative"
    else:
        label = "neutral"

    label_counts = {}

    for msg in analyzed:
        current_label = getattr(msg, "sentiment_label", "neutral")
        label_counts[current_label] = label_counts.get(current_label, 0) + 1

    return {
        "label": label,
        "score": round(average_score, 2),
        "summary": (
            f"Analyse sentimentale vocale basée sur {len(analyzed)} "
            f"message(s) vocal(aux). "
            f"Sentiment global: {label}. "
            f"Score moyen: {round(average_score, 2)}. "
            f"Détails: {label_counts}."
        ),
    }