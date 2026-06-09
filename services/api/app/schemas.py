from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime
    role: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class ResetPasswordResponse(BaseModel):
    message: str


class ScenarioCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    difficulty: int = 1
    system_prompt: str


class ScenarioOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    difficulty: int
    system_prompt: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class ScenarioMiniOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    difficulty: int

    class Config:
        from_attributes = True


# =========================
# Sessions
# =========================

class SessionStartIn(BaseModel):
    scenario_id: str
    duration_seconds: Optional[int] = Field(default=60, ge=60, le=1800)


class SessionOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str

    duration_seconds: Optional[int] = None
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_reason: Optional[str] = None
    remaining_seconds: Optional[int] = None
    is_expired: Optional[bool] = None

    created_at: datetime

    class Config:
        from_attributes = True


class SessionListItemOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str

    duration_seconds: Optional[int] = None
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_reason: Optional[str] = None
    remaining_seconds: Optional[int] = None
    is_expired: Optional[bool] = None

    created_at: datetime
    scenario: Optional[ScenarioMiniOut] = None

    class Config:
        from_attributes = True


class SessionStatusUpdateOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str

    duration_seconds: Optional[int] = None
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_reason: Optional[str] = None
    remaining_seconds: Optional[int] = None
    is_expired: Optional[bool] = None

    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# Messages
# =========================

class MessageIn(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str

    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_confidence: Optional[float] = None
    sentiment_source: Optional[str] = None
    sentiment_model: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True

# =========================
# Feedback
# =========================

class SessionFeedbackOut(BaseModel):
    id: str
    session_id: str
    user_id: str

    overall_score: Optional[float] = None
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None
    clarity_score: Optional[float] = None
    relevance_score: Optional[float] = None
    professionalism_score: Optional[float] = None

    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    final_advice: Optional[str] = None

    voice_sentiment_label: Optional[str] = None
    voice_sentiment_score: Optional[float] = None
    voice_sentiment_summary: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True

class SessionDetailOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str

    duration_seconds: Optional[int] = None
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_reason: Optional[str] = None
    remaining_seconds: Optional[int] = None
    is_expired: Optional[bool] = None

    created_at: datetime
    scenario: Optional[ScenarioMiniOut] = None
    messages: List[MessageOut] = Field(default_factory=list)
    feedback: Optional[SessionFeedbackOut] = None

    class Config:
        from_attributes = True


# =========================
# Dashboard
# =========================

class DashboardPerformanceOut(BaseModel):
    average_score: Optional[float] = None
    best_score: Optional[float] = None
    completed_rated_sessions: int = 0

    communication_average: Optional[float] = None
    confidence_average: Optional[float] = None
    clarity_average: Optional[float] = None
    relevance_average: Optional[float] = None
    professionalism_average: Optional[float] = None

    latest_feedback: Optional[SessionFeedbackOut] = None


# =========================
# Voice
# =========================

class VoiceMessageOut(BaseModel):
    session_id: str
    session_status: str
    transcription: str

    duration_seconds: Optional[int] = None
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_reason: Optional[str] = None
    remaining_seconds: Optional[int] = None
    is_expired: Optional[bool] = None

    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_confidence: Optional[float] = None
    sentiment_summary: Optional[str] = None
    sentiment_model: Optional[str] = None

    user_message: MessageOut
    assistant_message: MessageOut


# =========================
# Admin analytics
# =========================

class AdminBestUserOut(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    email: EmailStr
    score: Optional[float] = None


class AdminAnalyticsSummaryOut(BaseModel):
    total_users: int = 0
    total_sessions: int = 0
    completed_sessions: int = 0
    active_sessions: int = 0
    average_score: Optional[float] = None

    best_overall_user: Optional[AdminBestUserOut] = None
    best_communication_user: Optional[AdminBestUserOut] = None
    best_confidence_user: Optional[AdminBestUserOut] = None
    best_professionalism_user: Optional[AdminBestUserOut] = None


class AdminUserAnalyticsOut(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    email: EmailStr
    role: str
    created_at: Optional[datetime] = None

    sessions_count: int = 0
    completed_sessions_count: int = 0

    average_score: Optional[float] = None
    communication_average: Optional[float] = None
    confidence_average: Optional[float] = None
    clarity_average: Optional[float] = None
    relevance_average: Optional[float] = None
    professionalism_average: Optional[float] = None


class AdminAssistantIn(BaseModel):
    message: str = Field(..., min_length=1)


class AdminAssistantOut(BaseModel):
    answer: str
    intent: str
    data: Optional[Any] = None


class AdminUserMiniOut(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    email: EmailStr
    role: str


class AdminUserProgressSummaryOut(BaseModel):
    sessions_count: int = 0
    completed_sessions_count: int = 0

    average_score: Optional[float] = None
    communication_average: Optional[float] = None
    confidence_average: Optional[float] = None
    clarity_average: Optional[float] = None
    relevance_average: Optional[float] = None
    professionalism_average: Optional[float] = None

    best_score: Optional[float] = None
    latest_score: Optional[float] = None
    improvement: Optional[float] = None


class AdminUserProgressSkillAveragesOut(BaseModel):
    communication: Optional[float] = None
    confidence: Optional[float] = None
    clarity: Optional[float] = None
    relevance: Optional[float] = None
    professionalism: Optional[float] = None


class AdminUserProgressItemOut(BaseModel):
    session_id: str
    scenario_title: Optional[str] = None
    scenario_category: Optional[str] = None
    completed_at: Optional[datetime] = None

    overall_score: Optional[float] = None
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None
    clarity_score: Optional[float] = None
    relevance_score: Optional[float] = None
    professionalism_score: Optional[float] = None

    voice_sentiment_label: Optional[str] = None
    voice_sentiment_score: Optional[float] = None


class AdminUserProgressOut(BaseModel):
    user: AdminUserMiniOut
    summary: AdminUserProgressSummaryOut
    skill_averages: AdminUserProgressSkillAveragesOut
    progression: List[AdminUserProgressItemOut] = Field(default_factory=list)



class UserCVOut(BaseModel):
    id: str
    user_id: str
    filename: Optional[str] = None
    content_type: Optional[str] = None
    extracted_text: str
    structured_profile: Optional[str] = None
    profile_generated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

        

class UserCVProfileOut(BaseModel):
    cv_id: str
    user_id: str
    filename: Optional[str] = None
    profile_generated_at: Optional[datetime] = None
    profile: Dict[str, Any]