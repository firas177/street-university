from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr


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


class SessionStartIn(BaseModel):
    scenario_id: str


class SessionOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionListItemOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str
    created_at: datetime
    scenario: Optional[ScenarioMiniOut] = None

    class Config:
        from_attributes = True


class SessionStatusUpdateOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MessageIn(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


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
    created_at: datetime

    class Config:
        from_attributes = True


class SessionDetailOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str
    created_at: datetime
    scenario: Optional[ScenarioMiniOut] = None
    messages: List[MessageOut] = []
    feedback: Optional[SessionFeedbackOut] = None

    class Config:
        from_attributes = True


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