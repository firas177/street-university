import os
from typing import Optional

import requests


AUDIO_API_KEY = os.getenv("AUDIO_API_KEY", os.getenv("AI_API_KEY"))
AUDIO_TRANSCRIBE_URL = os.getenv("AUDIO_TRANSCRIBE_URL")
AUDIO_TRANSCRIBE_MODEL = os.getenv("AUDIO_TRANSCRIBE_MODEL", "whisper-large-v3")
AUDIO_TRANSCRIBE_LANGUAGE = os.getenv("AUDIO_TRANSCRIBE_LANGUAGE", "fr")
AUDIO_TRANSCRIBE_TIMEOUT = int(os.getenv("AUDIO_TRANSCRIBE_TIMEOUT", "120"))
AUDIO_MAX_FILE_SIZE_MB = int(os.getenv("AUDIO_MAX_FILE_SIZE_MB", "10"))

ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/ogg",
    "audio/flac",
    "audio/x-flac",
    "audio/aac",
    "audio/m4a",
    "video/webm",  # utile pour certains enregistrements micro navigateur
}

ALLOWED_AUDIO_EXTENSIONS = {
    ".webm",
    ".wav",
    ".mp3",
    ".mp4",
    ".ogg",
    ".flac",
    ".aac",
    ".m4a",
}


class AudioTranscriptionError(Exception):
    pass


def _normalize_content_type(content_type: Optional[str]) -> str:
    return (content_type or "").split(";")[0].strip().lower()


def _get_extension(filename: Optional[str]) -> str:
    if not filename or "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


def _validate_audio_upload(file_bytes: bytes, filename: Optional[str], content_type: Optional[str]) -> None:
    if not file_bytes:
        raise AudioTranscriptionError("Fichier audio vide.")

    max_bytes = AUDIO_MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise AudioTranscriptionError(
            f"Fichier trop volumineux. Taille max: {AUDIO_MAX_FILE_SIZE_MB} MB."
        )

    normalized_content_type = _normalize_content_type(content_type)
    extension = _get_extension(filename)

    if normalized_content_type and normalized_content_type not in ALLOWED_AUDIO_CONTENT_TYPES:
        raise AudioTranscriptionError(
            f"Format audio non supporté: {normalized_content_type}"
        )

    if extension and extension not in ALLOWED_AUDIO_EXTENSIONS:
        raise AudioTranscriptionError(
            f"Extension audio non supportée: {extension}"
        )


def _extract_transcribed_text(payload: dict) -> str:
    candidates = [
        payload.get("text"),
        payload.get("transcript"),
        payload.get("transcription"),
    ]

    data_field = payload.get("data")
    if isinstance(data_field, dict):
        candidates.extend([
            data_field.get("text"),
            data_field.get("transcript"),
            data_field.get("transcription"),
        ])

    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()

    raise AudioTranscriptionError("Réponse STT invalide: texte absent.")


def transcribe_uploaded_audio(
    file_bytes: bytes,
    filename: Optional[str],
    content_type: Optional[str] = None,
) -> str:
    if not AUDIO_API_KEY:
        raise AudioTranscriptionError("AUDIO_API_KEY non configuré.")

    if not AUDIO_TRANSCRIBE_URL:
        raise AudioTranscriptionError("AUDIO_TRANSCRIBE_URL non configuré.")

    _validate_audio_upload(file_bytes, filename, content_type)

    normalized_content_type = _normalize_content_type(content_type) or "audio/webm"
    safe_filename = filename or "audio.webm"

    headers = {
        "Authorization": f"Bearer {AUDIO_API_KEY}",
    }

    data = {
        "model": AUDIO_TRANSCRIBE_MODEL,
    }

    if AUDIO_TRANSCRIBE_LANGUAGE:
        data["language"] = AUDIO_TRANSCRIBE_LANGUAGE

    files = {
        "file": (safe_filename, file_bytes, normalized_content_type),
    }

    try:
        response = requests.post(
            AUDIO_TRANSCRIBE_URL,
            headers=headers,
            data=data,
            files=files,
            timeout=AUDIO_TRANSCRIBE_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise AudioTranscriptionError(f"Erreur réseau STT: {exc}") from exc

    if not (200 <= response.status_code < 300):
        detail = response.text[:500] if response.text else "Provider transcription indisponible."
        raise AudioTranscriptionError(f"Erreur transcription: {detail}")

    try:
        payload = response.json()
    except ValueError as exc:
        raise AudioTranscriptionError("Réponse transcription non JSON.") from exc

    return _extract_transcribed_text(payload)