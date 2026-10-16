from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field

from src.models import Status, Priority


class TaskBase(BaseModel):
    """Base task schema."""

    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    due_date: Optional[datetime] = None
    category_id: Optional[str] = None


class TaskCreate(TaskBase):
    """Task creation schema."""

    pass


class TaskUpdate(BaseModel):
    """Task update schema."""

    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    due_date: Optional[datetime] = None
    category_id: Optional[str] = None


class TaskResponse(TaskBase):
    """Task response schema."""

    id: str
    created_at: datetime
    user_id: str

    class Config:
        from_attributes = True
