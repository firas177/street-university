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

    class Config:
        from_attributes = True


class SessionStartIn(BaseModel):
    scenario_id: str


class SessionOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str

    class Config:
        from_attributes = True


class MessageIn(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str

    class Config:
        from_attributes = True


class SessionDetailOut(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    status: str
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True