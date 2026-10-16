from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Boolean, func, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, BaseModel


class User(Base, BaseModel):
    """User model."""

    __tablename__ = "user"

    email = Column(String(255), unique=True, nullable=False, index=True)

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    categories = relationship(
        "Category", back_populates="user", cascade="all, delete-orphan"
    )
    verification_codes = relationship(
        "VerificationCode", back_populates="user", cascade="all, delete-orphan"
    )


class VerificationCode(Base, BaseModel):
    """Email verification code model."""

    __tablename__ = "verification_code"

    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    user_id = Column(String(36), ForeignKey("user.id"), nullable=True, index=True)

    # Relationships
    user = relationship("User", back_populates="verification_codes", foreign_keys=[user_id])
