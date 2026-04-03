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


class SessionDetailOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str
    created_at: datetime
    scenario: Optional[ScenarioMiniOut] = None
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True