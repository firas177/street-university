from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

from .db import engine, Base, get_db
from .dependencies import get_current_user, require_roles
from .jwt_utils import create_access_token
from .ai_service import generate_ai_reply
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