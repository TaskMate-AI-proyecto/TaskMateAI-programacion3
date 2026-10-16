from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class BaseModel:
    """Base model with common fields."""

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
