import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, func, Integer, ForeignKey, Text, Float  
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    role = Column(String, nullable=False, default="student")

    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="password_reset_tokens")


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    difficulty = Column(Integer, nullable=False, default=1)
    system_prompt = Column(Text, nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    creator = relationship("User")
    sessions = relationship("Session", back_populates="scenario")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=False)

    status = Column(String, nullable=False, default="active")

    # Pourquoi la session est terminée :
    # "manual" = utilisateur a terminé
    # "timeout" = timer terminé
    # "system" = autre raison automatique
    completion_reason = Column(String, nullable=True)

    # Timer
    duration_seconds = Column(Integer, nullable=False, default=900, server_default="900")
    started_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")
    scenario = relationship("Scenario", back_populates="sessions")
    messages = relationship(
        "Message",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    feedback = relationship(
        "SessionFeedback",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    # Sentiment analysis pour les messages vocaux transcrits
    sentiment_label = Column(String, nullable=True)        # positive / neutral / negative
    sentiment_score = Column(Float, nullable=True)         # -1.0 à 1.0
    sentiment_confidence = Column(Float, nullable=True)    # 0.0 à 1.0
    sentiment_source = Column(String, nullable=True)       # voice_transcription / text / fallback
    sentiment_model = Column(String, nullable=True)        # nom du modèle utilisé

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("Session", back_populates="messages")

class SessionFeedback(Base):
    __tablename__ = "session_feedbacks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False, unique=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    overall_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    professionalism_score = Column(Float, nullable=True)

    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    final_advice = Column(Text, nullable=True)

    # Résumé global de l'analyse sentimentale des messages vocaux
    voice_sentiment_label = Column(String, nullable=True)   # positive / neutral / negative
    voice_sentiment_score = Column(Float, nullable=True)    # score moyen
    voice_sentiment_summary = Column(Text, nullable=True)   # résumé textuel

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("Session", back_populates="feedback")
    user = relationship("User")

class UserCV(Base):
    __tablename__ = "user_cvs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    filename = Column(String, nullable=True)
    content_type = Column(String, nullable=True)

    extracted_text = Column(Text, nullable=False, default="")
    structured_profile = Column(Text, nullable=True)
    profile_generated_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User")