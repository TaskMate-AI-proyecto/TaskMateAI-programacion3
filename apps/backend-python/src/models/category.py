from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, BaseModel


class Category(Base, BaseModel):
    """Task category model."""

    __tablename__ = "category"

    name = Column(String(255), nullable=False)
    color = Column(String(7), nullable=True)  # Hex color code
    user_id = Column(String(36), ForeignKey("user.id"), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="categories")
    tasks = relationship("Task", back_populates="category")
