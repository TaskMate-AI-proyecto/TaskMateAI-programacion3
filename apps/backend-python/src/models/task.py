from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from .base import Base, BaseModel


class Status(str, enum.Enum):
    """Task status enum."""

    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Priority(str, enum.Enum):
    """Task priority enum."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Task(Base, BaseModel):
    """Task model."""

    __tablename__ = "task"

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(Status), default=Status.PENDING, nullable=False)
    priority = Column(Enum(Priority), nullable=True)
    due_date = Column(DateTime, nullable=True)
    user_id = Column(String(36), ForeignKey("user.id"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("category.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="tasks")
    category = relationship("Category", back_populates="tasks")
