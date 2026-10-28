from typing import List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Chat request schema."""

    message: str = Field(..., min_length=1, description="User message")
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID")


class ChatResponse(BaseModel):
    """Chat response schema."""

    success: bool
    message: str = Field(description="AI response text (commands stripped)")
    commands_executed: List[str] = Field(default_factory=list, description="List of executed commands")
    created_tasks: List[str] = Field(default_factory=list, description="IDs of created tasks")
    updated_tasks: List[str] = Field(default_factory=list, description="IDs of updated tasks")
    deleted_tasks: List[str] = Field(default_factory=list, description="IDs of deleted tasks")


class ErrorResponse(BaseModel):
    """Error response schema."""

    success: bool = False
    message: str
