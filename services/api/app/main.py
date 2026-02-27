from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .schemas import UserLogin
from .jwt_utils import create_access_token


from .db import engine, Base, get_db
from . import models, schemas, auth

app = FastAPI(title="Street University API")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Vérifier si l'email existe déjà
    existing_user = auth.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email déjà utilisé"
        )

    # Créer l'utilisateur
    new_user = auth.create_user(db, user)
    return new_user

@app.post("/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = auth.get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")

    if not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}