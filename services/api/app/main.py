from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from .db import engine, Base, get_db
from . import models, schemas, auth
from .schemas import UserLogin
from .jwt_utils import create_access_token, SECRET_KEY, ALGORITHM

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Token invalide",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (JWTError, ValueError):
        raise credentials_exception

    user = auth.get_user_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable"
        )

    return user


@app.post(
    "/auth/register",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED
)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = auth.get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email déjà utilisé"
        )

    new_user = auth.create_user(db, user)
    return new_user


@app.post("/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = auth.get_user_by_email(db, payload.email)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Email ou mot de passe incorrect"
        )

    if not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Email ou mot de passe incorrect"
        )

    token = create_access_token(subject=str(user.id))

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/auth/me")
def read_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
    }