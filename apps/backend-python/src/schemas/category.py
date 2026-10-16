from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """Base category schema."""

    name: str = Field(..., min_length=1)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryCreate(CategoryBase):
    """Category creation schema."""

    pass


class CategoryUpdate(BaseModel):
    """Category update schema."""

    name: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryResponse(CategoryBase):
    """Category response schema."""

    id: str
    created_at: datetime

    class Config:
        from_attributes = True
