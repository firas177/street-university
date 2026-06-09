import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from passlib.context import CryptContext

from . import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

RESET_TOKEN_TTL_MINUTES = 15


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        email=user.email,
        password_hash=hash_password(user.password),
        full_name=user.full_name,
        role="student",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def invalidate_existing_reset_tokens(db: Session, user_id: str) -> None:
    now = datetime.now(timezone.utc)
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user_id,
        models.PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now}, synchronize_session=False)
    db.commit()


def create_password_reset_token(db: Session, user: models.User) -> str:
    invalidate_existing_reset_tokens(db, user.id)

    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_reset_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)

    record = models.PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()
    return raw_token


def get_valid_reset_token(db: Session, raw_token: str):
    if not raw_token or not raw_token.strip():
        return None

    token_hash = hash_reset_token(raw_token.strip())
    now = datetime.now(timezone.utc)

    return (
        db.query(models.PasswordResetToken)
        .filter(
            models.PasswordResetToken.token_hash == token_hash,
            models.PasswordResetToken.used_at.is_(None),
            models.PasswordResetToken.expires_at > now,
        )
        .first()
    )


def reset_password_with_token(db: Session, raw_token: str, new_password: str):
    record = get_valid_reset_token(db, raw_token)
    if not record:
        return None

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    if not user:
        return None

    user.password_hash = hash_password(new_password)
    record.used_at = datetime.now(timezone.utc)
    db.add(user)
    db.add(record)
    db.commit()
    db.refresh(user)
    return user