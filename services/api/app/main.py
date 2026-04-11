from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

from .db import engine, Base, get_db
from .dependencies import get_current_user, require_roles
from .jwt_utils import create_access_token
from .ai_service import generate_ai_reply, generate_session_feedback
from .schemas import UserLogin
from . import models, schemas, auth

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
    return {"access_token": token, "token_type": "bearer"}


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
    return db.query(models.Scenario).order_by(models.Scenario.created_at.desc()).all()


@app.get("/scenarios/{scenario_id}", response_model=schemas.ScenarioOut)
def get_scenario(
    scenario_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    scenario = db.query(models.Scenario).filter(models.Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario introuvable")
    return scenario


@app.post("/sessions/start", response_model=schemas.SessionOut)
def start_session(
    payload: schemas.SessionStartIn,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("student", "admin")),
):
    scenario = db.query(models.Scenario).filter(models.Scenario.id == payload.scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario introuvable")

    session = models.Session(
        user_id=current_user.id,
        scenario_id=scenario.id,
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    first_prompt = (
        "Commence immédiatement la simulation. "
        "Présente brièvement le contexte puis pose une première question claire. "
        "Ne donne pas la réponse. "
        "Une seule question à la fois."
    )

    assistant_text = generate_ai_reply(
        system_prompt=scenario.system_prompt,
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

    db.refresh(session)
    return session


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
    return sessions


@app.patch("/sessions/{session_id}/complete", response_model=schemas.SessionStatusUpdateOut)
def complete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    if session.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    session.status = "completed"
    db.commit()
    db.refresh(session)

    existing_feedback = (
        db.query(models.SessionFeedback)
        .filter(models.SessionFeedback.session_id == session.id)
        .first()
    )

    if not existing_feedback:
        session_messages = (
            db.query(models.Message)
            .filter(models.Message.session_id == session.id)
            .order_by(models.Message.created_at.asc())
            .all()
        )

        messages_payload = [
            {"role": msg.role, "content": msg.content}
            for msg in session_messages
        ]

        feedback_data = generate_session_feedback(messages_payload)

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
        )
        db.add(feedback)
        db.commit()

    return session


@app.post("/sessions/{session_id}/message", response_model=schemas.MessageOut)
def send_message(
    session_id: str,
    payload: schemas.MessageIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    if session.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Cette session est déjà terminée")

    scenario = db.query(models.Scenario).filter(models.Scenario.id == session.scenario_id).first()
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
        history.append({"role": msg.role, "content": msg.content})

    assistant_text = generate_ai_reply(
        system_prompt=scenario.system_prompt,
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

    return assistant_msg


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

    session.messages = sorted(session.messages, key=lambda msg: msg.created_at)
    return session


@app.get("/sessions/{session_id}/feedback", response_model=schemas.SessionFeedbackOut)
def get_session_feedback(
    session_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()

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