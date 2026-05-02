from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone, timedelta
import re
import json

from .audio_service import transcribe_uploaded_audio, AudioTranscriptionError
from .db import engine, Base, get_db
from .dependencies import get_current_user, require_roles
from .jwt_utils import create_access_token
from .ai_service import generate_ai_reply, generate_session_feedback
from .schemas import UserLogin
from . import models, schemas, auth

from .cv_service import (
    validate_cv_file,
    extract_text_from_pdf_bytes,
    build_structured_cv_profile,
    CVExtractionError,
)

from .sentiment_service import analyze_text_sentiment, aggregate_voice_sentiments
# ============================================================
# TIMER HELPERS
# ============================================================

def now_utc():
    return datetime.now(timezone.utc)


def safe_duration_seconds(value):
    try:
        duration = int(value) if value is not None else 900
    except Exception:
        duration = 900

    if duration < 60:
        duration = 60

    if duration > 7200:
        duration = 7200

    return duration


def ensure_session_timer(session, db: Session):
    if not session:
        return session

    if session.status != "active":
        return session

    changed = False

    if session.duration_seconds is None:
        session.duration_seconds = 900
        changed = True

    if session.started_at is None:
        session.started_at = now_utc()
        changed = True

    if session.expires_at is None:
        started_at = session.started_at

        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)

        session.expires_at = started_at + timedelta(
            seconds=session.duration_seconds
        )
        changed = True

    if changed:
        db.add(session)
        db.commit()
        db.refresh(session)

    return session


def calculate_remaining_seconds(session):
    if not session or session.status != "active":
        return 0

    if not session.expires_at:
        return session.duration_seconds or 900

    expires_at = session.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    remaining = int((expires_at - now_utc()).total_seconds())

    return max(0, remaining)


def message_to_dict(message):
    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "sentiment_label": getattr(message, "sentiment_label", None),
        "sentiment_score": getattr(message, "sentiment_score", None),
        "sentiment_confidence": getattr(message, "sentiment_confidence", None),
        "sentiment_source": getattr(message, "sentiment_source", None),
        "sentiment_model": getattr(message, "sentiment_model", None),
        "created_at": message.created_at,
    }

def scenario_to_dict(scenario):
    if not scenario:
        return None

    return {
        "id": scenario.id,
        "title": scenario.title,
        "description": scenario.description,
        "category": scenario.category,
        "difficulty": scenario.difficulty,
    }


def feedback_to_dict(feedback):
    if not feedback:
        return None

    return {
        "id": feedback.id,
        "session_id": feedback.session_id,
        "user_id": feedback.user_id,
        "overall_score": feedback.overall_score,
        "communication_score": feedback.communication_score,
        "confidence_score": feedback.confidence_score,
        "clarity_score": feedback.clarity_score,
        "relevance_score": feedback.relevance_score,
        "professionalism_score": feedback.professionalism_score,
        "strengths": feedback.strengths,
        "weaknesses": feedback.weaknesses,
        "final_advice": feedback.final_advice,
        "voice_sentiment_label": getattr(feedback, "voice_sentiment_label", None),
        "voice_sentiment_score": getattr(feedback, "voice_sentiment_score", None),
        "voice_sentiment_summary": getattr(feedback, "voice_sentiment_summary", None),
        "created_at": feedback.created_at,
    }

def serialize_session(session):
    remaining = calculate_remaining_seconds(session)

    messages = list(getattr(session, "messages", []) or [])
    messages = sorted(messages, key=lambda msg: msg.created_at)

    return {
        "id": session.id,
        "user_id": session.user_id,
        "scenario_id": session.scenario_id,
        "status": session.status,
        "duration_seconds": session.duration_seconds,
        "started_at": session.started_at,
        "expires_at": session.expires_at,
        "completed_at": session.completed_at,
        "completion_reason": session.completion_reason,
        "created_at": session.created_at,
        "remaining_seconds": remaining,
        "is_expired": session.status != "active" or remaining <= 0,
        "scenario": scenario_to_dict(getattr(session, "scenario", None)),
        "messages": [message_to_dict(message) for message in messages],
        "feedback": feedback_to_dict(getattr(session, "feedback", None)),
    }


def _is_exit_intent(text: str) -> bool:
    value = (text or "").strip().lower()

    patterns = [
        r"\bje veux quitter\b",
        r"\bje veux partir\b",
        r"\barr[êe]ter l[' ]?entretien\b",
        r"\bon arr[êe]te\b",
        r"\bstop interview\b",
        r"\bend interview\b",
        r"\bquit\b",
        r"\bexit\b",
    ]

    return any(re.search(pattern, value, flags=re.IGNORECASE) for pattern in patterns)

def clamp_score(value, minimum=0, maximum=10):
    try:
        value = float(value)
    except Exception:
        value = 0

    return round(max(minimum, min(maximum, value)), 1)


def apply_voice_sentiment_to_feedback(feedback_data: dict, voice_sentiment: dict) -> dict:
    """
    Ajuste légèrement le feedback final avec l'analyse sentimentale vocale.

    Important:
    - Le sentiment ne remplace pas l'évaluation IA.
    - Il influence surtout confiance, communication et professionnalisme.
    - Un sentiment positif ne doit pas faire baisser le score global.
    - Si aucun sentiment vocal n'existe, on garde le feedback original.
    """

    if not voice_sentiment:
        return feedback_data

    sentiment_score = voice_sentiment.get("score")

    if sentiment_score is None:
        return feedback_data

    try:
        sentiment_score = float(sentiment_score)
    except Exception:
        return feedback_data

    adjusted = dict(feedback_data)

    communication = clamp_score(adjusted.get("communication_score", 0))
    confidence = clamp_score(adjusted.get("confidence_score", 0))
    clarity = clamp_score(adjusted.get("clarity_score", 0))
    relevance = clamp_score(adjusted.get("relevance_score", 0))
    professionalism = clamp_score(adjusted.get("professionalism_score", 0))

    # Influence modérée du sentiment vocal
    confidence = clamp_score(confidence + sentiment_score * 1.0)
    communication = clamp_score(communication + sentiment_score * 0.5)
    professionalism = clamp_score(professionalism + sentiment_score * 0.3)

    # Recalcul pondéré du score global
    weighted_overall = (
        communication * 0.20
        + confidence * 0.25
        + clarity * 0.20
        + relevance * 0.25
        + professionalism * 0.10
    )

    original_overall = clamp_score(adjusted.get("overall_score", 0))
    weighted_overall = clamp_score(weighted_overall)

    # Si le sentiment est positif, il ne doit jamais diminuer le score global.
    # Si le sentiment est négatif, il peut diminuer légèrement le score global.
    if sentiment_score > 0:
        final_overall = max(original_overall, weighted_overall)
    else:
        final_overall = weighted_overall

    adjusted["communication_score"] = communication
    adjusted["confidence_score"] = confidence
    adjusted["clarity_score"] = clarity
    adjusted["relevance_score"] = relevance
    adjusted["professionalism_score"] = professionalism
    adjusted["overall_score"] = final_overall

    sentiment_label = voice_sentiment.get("label")

    if sentiment_label:
        old_advice = adjusted.get("final_advice") or ""

        adjusted["final_advice"] = (
            old_advice
            + "\n\nAnalyse vocale : le sentiment global détecté est "
            + f"{sentiment_label}. Cette information a été utilisée pour ajuster légèrement "
            + "les scores liés à la confiance, la communication et le professionnalisme."
        ).strip()

    return adjusted






def _finalize_session_with_feedback(
    session,
    db: Session,
    reason: str = "manual",
):
    """
    Termine une session + génère le feedback si pas encore généré.

    reason:
    - manual
    - timeout
    - exit_intent
    """

    if session.status != "completed":
        session.status = "completed"
        session.completed_at = now_utc()
        session.completion_reason = reason

        db.add(session)
        db.commit()
        db.refresh(session)

    else:
        if session.completed_at is None:
            session.completed_at = now_utc()

        if session.completion_reason is None:
            session.completion_reason = reason

        db.add(session)
        db.commit()
        db.refresh(session)

    existing_feedback = (
        db.query(models.SessionFeedback)
        .filter(models.SessionFeedback.session_id == session.id)
        .first()
    )

    if existing_feedback:
        return session, existing_feedback

    session_messages = (
        db.query(models.Message)
        .filter(models.Message.session_id == session.id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    voice_sentiment = aggregate_voice_sentiments(session_messages)

    messages_payload = [
        {"role": msg.role, "content": msg.content}
        for msg in session_messages
        if msg.content
    ]

    if voice_sentiment.get("label"):
        messages_payload.append(
            {
                "role": "system",
                "content": (
                    "Résumé d'analyse sentimentale des messages vocaux utilisateur : "
                    f"{voice_sentiment.get('summary')} "
                    "Utilise cette information pour enrichir l'évaluation de la confiance, "
                    "de la clarté et du professionnalisme. "
                    "Ne pénalise pas automatiquement un sentiment négatif si la réponse reste pertinente."
                ),
            }
        )

    feedback_data = generate_session_feedback(messages_payload)

    feedback_data = apply_voice_sentiment_to_feedback(
        feedback_data,
        voice_sentiment,
    )

    feedback = models.SessionFeedback(
        session_id=session.id,
        user_id=session.user_id,
        overall_score=feedback_data.get("overall_score"),
        communication_score=feedback_data.get("communication_score"),
        confidence_score=feedback_data.get("confidence_score"),
        clarity_score=feedback_data.get("clarity_score"),
        relevance_score=feedback_data.get("relevance_score"),
        professionalism_score=feedback_data.get("professionalism_score"),
        strengths=feedback_data.get("strengths"),
        weaknesses=feedback_data.get("weaknesses"),
        final_advice=feedback_data.get("final_advice"),
        voice_sentiment_label=voice_sentiment.get("label"),
        voice_sentiment_score=voice_sentiment.get("score"),
        voice_sentiment_summary=voice_sentiment.get("summary"),
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    db.refresh(session)

    return session, feedback


def auto_complete_if_expired(session, db: Session):
    if not session:
        return session

    session = ensure_session_timer(session, db)

    if session.status == "active" and calculate_remaining_seconds(session) <= 0:
        session, _feedback = _finalize_session_with_feedback(
            session,
            db,
            reason="timeout",
        )

    return session


# ============================================================
# CV + AI HELPERS
# ============================================================

def get_user_cv_profile(db: Session, user_id: str):
    user_cv = (
        db.query(models.UserCV)
        .filter(models.UserCV.user_id == user_id)
        .order_by(models.UserCV.created_at.desc())
        .first()
    )

    if not user_cv:
        return None

    if not user_cv.structured_profile:
        return None

    try:
        return json.loads(user_cv.structured_profile)
    except Exception:
        return None


def flatten_cv_skills(profile: dict) -> list[str]:
    technical_skills = profile.get("technical_skills") or {}
    skills = []

    if isinstance(technical_skills, dict):
        for values in technical_skills.values():
            if isinstance(values, list):
                skills.extend(values)

    cleaned = []

    for skill in skills:
        if skill and skill not in cleaned:
            cleaned.append(skill)

    return cleaned


def build_cv_context_for_ai(profile: dict | None) -> str:
    if not profile:
        return ""

    summary = profile.get("professional_summary") or ""
    education = profile.get("education") or []
    experience = profile.get("experience") or []
    projects = profile.get("projects") or []
    certifications = profile.get("certifications") or []
    languages = profile.get("languages") or []
    skills = flatten_cv_skills(profile)

    return f"""
PROFIL CV DU CANDIDAT DISPONIBLE :

Résumé professionnel :
{summary}

Formation :
{education}

Expériences :
{experience}

Projets :
{projects}

Compétences techniques détectées :
{skills}

Certifications :
{certifications}

Langues :
{languages}

CONSIGNES IMPORTANTES :
- Utilise ce CV pour poser des questions précises et personnalisées.
- Ne pose pas seulement des questions générales.
- Pose une seule question à la fois.
- Vérifie si le candidat comprend vraiment ce qu’il a écrit dans son CV.
- Demande-lui d’expliquer ses projets, ses choix techniques, son rôle, ses difficultés et ses résultats.
- Ne donne pas les réponses à sa place.
- Si une information n’est pas dans le CV, ne l’invente pas.
- Si le candidat donne une réponse vague, demande une clarification concrète.
- Si aucun CV n’est disponible, fais une simulation normale.
""".strip()


def build_system_prompt_with_optional_cv(
    base_system_prompt: str,
    cv_profile: dict | None,
) -> str:
    cv_context = build_cv_context_for_ai(cv_profile)

    if not cv_context:
        return base_system_prompt

    return f"""
{base_system_prompt}

{cv_context}
""".strip()


def build_first_prompt_with_optional_cv(cv_profile: dict | None) -> str:
    if cv_profile:
        return (
            "Commence immédiatement la simulation. "
            "Le candidat a fourni un CV. "
            "Analyse son profil et pose une première question spécifique basée sur un projet, "
            "une compétence technique, une expérience, une formation ou une certification mentionnée dans son CV. "
            "Ne pose pas une question générale si tu peux poser une question personnalisée. "
            "Ne donne pas la réponse. "
            "Une seule question à la fois."
        )

    return (
        "Commence immédiatement la simulation. "
        "Présente brièvement le contexte puis pose une première question claire. "
        "Ne donne pas la réponse. "
        "Une seule question à la fois."
    )


def get_enhanced_system_prompt_for_user(
    db: Session,
    user_id: str,
    base_system_prompt: str,
) -> tuple[str, dict | None]:
    cv_profile = get_user_cv_profile(db, user_id)

    enhanced_system_prompt = build_system_prompt_with_optional_cv(
        base_system_prompt,
        cv_profile,
    )

    return enhanced_system_prompt, cv_profile


# ============================================================
# APP CONFIG
# ============================================================

app = FastAPI(title="Street University API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Street University API running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ============================================================
# AUTH
# ============================================================

@app.post("/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = auth.get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    new_user = auth.create_user(db, user)

    return new_user


@app.post("/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = auth.get_user_by_email(db, payload.email)

    if not user:
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")

    if not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")

    token = create_access_token(subject=user.email)

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@app.get("/auth/me")
def auth_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
    }


@app.get("/me")
def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
    }


@app.get("/admin/test")
def admin_test(current_user=Depends(require_roles("admin"))):
    return {"message": f"Bienvenue admin {current_user.email}"}


# ============================================================
# CV ROUTES
# ============================================================

@app.post("/me/cv/upload", response_model=schemas.UserCVOut)
async def upload_my_cv(
    cv: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    file_bytes = await cv.read()

    try:
        validate_cv_file(
            filename=cv.filename,
            content_type=cv.content_type,
            file_bytes=file_bytes,
        )

        extracted_text = extract_text_from_pdf_bytes(file_bytes)

    except CVExtractionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    existing_cv = (
        db.query(models.UserCV)
        .filter(models.UserCV.user_id == current_user.id)
        .order_by(models.UserCV.created_at.desc())
        .first()
    )

    if existing_cv:
        existing_cv.filename = cv.filename
        existing_cv.content_type = cv.content_type
        existing_cv.extracted_text = extracted_text
        existing_cv.structured_profile = None
        existing_cv.profile_generated_at = None
        existing_cv.updated_at = now_utc()

        db.add(existing_cv)
        db.commit()
        db.refresh(existing_cv)

        return existing_cv

    user_cv = models.UserCV(
        user_id=current_user.id,
        filename=cv.filename,
        content_type=cv.content_type,
        extracted_text=extracted_text,
        structured_profile=None,
        profile_generated_at=None,
        updated_at=now_utc(),
    )

    db.add(user_cv)
    db.commit()
    db.refresh(user_cv)

    return user_cv


@app.get("/me/cv", response_model=schemas.UserCVOut)
def get_my_cv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_cv = (
        db.query(models.UserCV)
        .filter(models.UserCV.user_id == current_user.id)
        .order_by(models.UserCV.created_at.desc())
        .first()
    )

    if not user_cv:
        raise HTTPException(status_code=404, detail="Aucun CV trouvé.")

    return user_cv


@app.post("/me/cv/structure", response_model=schemas.UserCVProfileOut)
def structure_my_cv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_cv = (
        db.query(models.UserCV)
        .filter(models.UserCV.user_id == current_user.id)
        .order_by(models.UserCV.created_at.desc())
        .first()
    )

    if not user_cv:
        raise HTTPException(status_code=404, detail="Aucun CV trouvé.")

    if not user_cv.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Aucun texte extrait du CV.",
        )

    profile = build_structured_cv_profile(user_cv.extracted_text)

    user_cv.structured_profile = json.dumps(profile, ensure_ascii=False)
    user_cv.profile_generated_at = now_utc()
    user_cv.updated_at = now_utc()

    db.add(user_cv)
    db.commit()
    db.refresh(user_cv)

    return {
        "cv_id": user_cv.id,
        "user_id": user_cv.user_id,
        "filename": user_cv.filename,
        "profile_generated_at": user_cv.profile_generated_at,
        "profile": profile,
    }


@app.get("/me/cv/profile", response_model=schemas.UserCVProfileOut)
def get_my_cv_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_cv = (
        db.query(models.UserCV)
        .filter(models.UserCV.user_id == current_user.id)
        .order_by(models.UserCV.created_at.desc())
        .first()
    )

    if not user_cv:
        raise HTTPException(status_code=404, detail="Aucun CV trouvé.")

    if not user_cv.structured_profile:
        raise HTTPException(
            status_code=404,
            detail="Profil CV structuré non généré.",
        )

    try:
        profile = json.loads(user_cv.structured_profile)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Profil CV structuré invalide.",
        )

    return {
        "cv_id": user_cv.id,
        "user_id": user_cv.user_id,
        "filename": user_cv.filename,
        "profile_generated_at": user_cv.profile_generated_at,
        "profile": profile,
    }


@app.delete("/me/cv")
def delete_my_cv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_cv = (
        db.query(models.UserCV)
        .filter(models.UserCV.user_id == current_user.id)
        .order_by(models.UserCV.created_at.desc())
        .first()
    )

    if not user_cv:
        raise HTTPException(status_code=404, detail="Aucun CV trouvé.")

    db.delete(user_cv)
    db.commit()

    return {"message": "CV supprimé avec succès."}


# ============================================================
# SCENARIOS
# ============================================================

@app.post("/scenarios", response_model=schemas.ScenarioOut)
def create_scenario(
    data: schemas.ScenarioCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("mentor", "admin")),
):
    scenario = models.Scenario(
        title=data.title,
        description=data.description,
        category=data.category,
        difficulty=data.difficulty,
        system_prompt=data.system_prompt,
        created_by=current_user.id,
    )

    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    return scenario


@app.get("/scenarios", response_model=list[schemas.ScenarioOut])
def list_scenarios(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(models.Scenario)
        .order_by(models.Scenario.created_at.desc())
        .all()
    )


@app.get("/scenarios/{scenario_id}", response_model=schemas.ScenarioOut)
def get_scenario(
    scenario_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    scenario = (
        db.query(models.Scenario)
        .filter(models.Scenario.id == scenario_id)
        .first()
    )

    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario introuvable")

    return scenario


# ============================================================
# SESSIONS
# ============================================================

@app.post("/sessions/start", response_model=schemas.SessionOut)
def start_session(
    payload: schemas.SessionStartIn,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("student", "admin")),
):
    scenario = (
        db.query(models.Scenario)
        .filter(models.Scenario.id == payload.scenario_id)
        .first()
    )

    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario introuvable")

    duration_seconds = safe_duration_seconds(payload.duration_seconds)
    started_at = now_utc()
    expires_at = started_at + timedelta(seconds=duration_seconds)

    session = models.Session(
        user_id=current_user.id,
        scenario_id=scenario.id,
        status="active",
        duration_seconds=duration_seconds,
        started_at=started_at,
        expires_at=expires_at,
        completed_at=None,
        completion_reason=None,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    enhanced_system_prompt, cv_profile = get_enhanced_system_prompt_for_user(
        db=db,
        user_id=current_user.id,
        base_system_prompt=scenario.system_prompt,
    )

    first_prompt = build_first_prompt_with_optional_cv(cv_profile)

    assistant_text = generate_ai_reply(
        system_prompt=enhanced_system_prompt,
        history=[],
        user_message=first_prompt,
    )

    first_ai_message = models.Message(
        session_id=session.id,
        role="assistant",
        content=assistant_text,
    )

    db.add(first_ai_message)
    db.commit()

    session = (
        db.query(models.Session)
        .options(
            joinedload(models.Session.scenario),
            joinedload(models.Session.messages),
            joinedload(models.Session.feedback),
        )
        .filter(models.Session.id == session.id)
        .first()
    )

    return serialize_session(session)


@app.get("/sessions", response_model=list[schemas.SessionListItemOut])
def list_sessions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = (
        db.query(models.Session)
        .options(joinedload(models.Session.scenario))
        .order_by(models.Session.created_at.desc())
    )

    if current_user.role != "admin":
        query = query.filter(models.Session.user_id == current_user.id)

    sessions = query.all()

    result = []

    for session in sessions:
        session = auto_complete_if_expired(session, db)
        result.append(serialize_session(session))

    return result


@app.get("/sessions/{session_id}", response_model=schemas.SessionDetailOut)
def get_session_detail(
    session_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = (
        db.query(models.Session)
        .options(
            joinedload(models.Session.scenario),
            joinedload(models.Session.messages),
            joinedload(models.Session.feedback),
        )
        .filter(models.Session.id == session_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    if session.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = auto_complete_if_expired(session, db)

    session = (
        db.query(models.Session)
        .options(
            joinedload(models.Session.scenario),
            joinedload(models.Session.messages),
            joinedload(models.Session.feedback),
        )
        .filter(models.Session.id == session_id)
        .first()
    )

    return serialize_session(session)


@app.patch("/sessions/{session_id}/complete", response_model=schemas.SessionStatusUpdateOut)
def complete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = (
        db.query(models.Session)
        .filter(models.Session.id == session_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    if session.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = ensure_session_timer(session, db)

    reason = "manual"

    if session.status == "active" and calculate_remaining_seconds(session) <= 0:
        reason = "timeout"

    session, _feedback = _finalize_session_with_feedback(
        session,
        db,
        reason=reason,
    )

    return serialize_session(session)


@app.post("/sessions/{session_id}/message", response_model=schemas.SessionDetailOut)
def send_message(
    session_id: str,
    payload: schemas.MessageIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = (
        db.query(models.Session)
        .options(
            joinedload(models.Session.scenario),
            joinedload(models.Session.messages),
            joinedload(models.Session.feedback),
        )
        .filter(models.Session.id == session_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    if session.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = auto_complete_if_expired(session, db)

    if session.status != "active":
        raise HTTPException(status_code=409, detail="SESSION_EXPIRED")

    scenario = (
        db.query(models.Scenario)
        .filter(models.Scenario.id == session.scenario_id)
        .first()
    )

    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario introuvable")

    user_msg = models.Message(
        session_id=session.id,
        role="user",
        content=payload.content,
    )

    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    previous_messages = (
        db.query(models.Message)
        .filter(models.Message.session_id == session.id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    history = []

    for msg in previous_messages[:-1]:
        history.append({
            "role": msg.role,
            "content": msg.content,
        })

    enhanced_system_prompt, _cv_profile = get_enhanced_system_prompt_for_user(
        db=db,
        user_id=current_user.id,
        base_system_prompt=scenario.system_prompt,
    )

    assistant_text = generate_ai_reply(
        system_prompt=enhanced_system_prompt,
        history=history,
        user_message=payload.content,
    )

    assistant_msg = models.Message(
        session_id=session.id,
        role="assistant",
        content=assistant_text,
    )

    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    if _is_exit_intent(payload.content):
        session, _feedback = _finalize_session_with_feedback(
            session,
            db,
            reason="exit_intent",
        )
    else:
        db.refresh(session)

    session = (
        db.query(models.Session)
        .options(
            joinedload(models.Session.scenario),
            joinedload(models.Session.messages),
            joinedload(models.Session.feedback),
        )
        .filter(models.Session.id == session_id)
        .first()
    )

    return serialize_session(session)


@app.get("/sessions/{session_id}/feedback", response_model=schemas.SessionFeedbackOut)
def get_session_feedback(
    session_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = (
        db.query(models.Session)
        .filter(models.Session.id == session_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    if session.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    feedback = (
        db.query(models.SessionFeedback)
        .filter(models.SessionFeedback.session_id == session_id)
        .first()
    )

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback introuvable")

    return feedback


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/dashboard/performance", response_model=schemas.DashboardPerformanceOut)
def get_dashboard_performance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    feedbacks = (
        db.query(models.SessionFeedback)
        .filter(models.SessionFeedback.user_id == current_user.id)
        .order_by(models.SessionFeedback.created_at.desc())
        .all()
    )

    if not feedbacks:
        return {
            "average_score": None,
            "best_score": None,
            "completed_rated_sessions": 0,
            "communication_average": None,
            "confidence_average": None,
            "clarity_average": None,
            "relevance_average": None,
            "professionalism_average": None,
            "latest_feedback": None,
        }

    def avg(values):
        valid = [v for v in values if v is not None]

        if not valid:
            return None

        return round(sum(valid) / len(valid), 1)

    overall_values = [f.overall_score for f in feedbacks]
    communication_values = [f.communication_score for f in feedbacks]
    confidence_values = [f.confidence_score for f in feedbacks]
    clarity_values = [f.clarity_score for f in feedbacks]
    relevance_values = [f.relevance_score for f in feedbacks]
    professionalism_values = [f.professionalism_score for f in feedbacks]

    valid_overall = [v for v in overall_values if v is not None]

    return {
        "average_score": avg(overall_values),
        "best_score": round(max(valid_overall), 1) if valid_overall else None,
        "completed_rated_sessions": len(feedbacks),
        "communication_average": avg(communication_values),
        "confidence_average": avg(confidence_values),
        "clarity_average": avg(clarity_values),
        "relevance_average": avg(relevance_values),
        "professionalism_average": avg(professionalism_values),
        "latest_feedback": feedbacks[0],
    }


# ============================================================
# VOICE MESSAGE
# ============================================================

@app.post("/sessions/{session_id}/voice-message", response_model=schemas.VoiceMessageOut)
async def send_voice_message(
    session_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    audio: UploadFile = File(...),
):
    session = (
        db.query(models.Session)
        .options(
            joinedload(models.Session.scenario),
            joinedload(models.Session.messages),
            joinedload(models.Session.feedback),
        )
        .filter(models.Session.id == session_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    if session.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = auto_complete_if_expired(session, db)

    if session.status != "active":
        raise HTTPException(status_code=409, detail="SESSION_EXPIRED")

    scenario = (
        db.query(models.Scenario)
        .filter(models.Scenario.id == session.scenario_id)
        .first()
    )

    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario introuvable")

    audio_bytes = await audio.read()

    try:
        transcription = transcribe_uploaded_audio(
            file_bytes=audio_bytes,
            filename=audio.filename,
            content_type=audio.content_type,
        )
    except AudioTranscriptionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    transcription = (transcription or "").strip()

    if not transcription:
        raise HTTPException(status_code=400, detail="Transcription vide.")

    sentiment = analyze_text_sentiment(transcription)

    user_msg = models.Message(
        session_id=session.id,
        role="user",
        content=transcription,
        sentiment_label=sentiment.get("label"),
        sentiment_score=sentiment.get("score"),
        sentiment_confidence=sentiment.get("confidence"),
        sentiment_source="voice_transcription",
        sentiment_model=sentiment.get("model"),
    )

    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    previous_messages = (
        db.query(models.Message)
        .filter(models.Message.session_id == session.id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    history = []

    for msg in previous_messages[:-1]:
        history.append({
            "role": msg.role,
            "content": msg.content,
        })

    enhanced_system_prompt, _cv_profile = get_enhanced_system_prompt_for_user(
        db=db,
        user_id=current_user.id,
        base_system_prompt=scenario.system_prompt,
    )

    assistant_text = generate_ai_reply(
        system_prompt=enhanced_system_prompt,
        history=history,
        user_message=transcription,
    )

    assistant_msg = models.Message(
        session_id=session.id,
        role="assistant",
        content=assistant_text,
    )

    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    if _is_exit_intent(transcription):
        session, _feedback = _finalize_session_with_feedback(
            session,
            db,
            reason="exit_intent",
        )
    else:
        db.refresh(session)

    session = (
        db.query(models.Session)
        .options(
            joinedload(models.Session.scenario),
            joinedload(models.Session.messages),
            joinedload(models.Session.feedback),
        )
        .filter(models.Session.id == session_id)
        .first()
    )

    remaining = calculate_remaining_seconds(session)

    return {
        "session_id": session.id,
        "session_status": session.status,
        "transcription": transcription,
        "duration_seconds": session.duration_seconds,
        "started_at": session.started_at,
        "expires_at": session.expires_at,
        "completed_at": session.completed_at,
        "completion_reason": session.completion_reason,
        "remaining_seconds": remaining,
        "is_expired": session.status != "active" or remaining <= 0,
        "sentiment_label": sentiment.get("label"),
        "sentiment_score": sentiment.get("score"),
        "sentiment_confidence": sentiment.get("confidence"),
        "sentiment_summary": sentiment.get("summary"),
        "sentiment_model": sentiment.get("model"),
        "user_message": message_to_dict(user_msg),
        "assistant_message": message_to_dict(assistant_msg),
    }