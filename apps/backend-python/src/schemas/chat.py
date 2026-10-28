from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (user/assistant)")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message to send to Gemini")
    history: list[ChatMessage] | None = Field(
        default=None, description="Previous chat messages"
    )


class ChatResponse(BaseModel):
    success: bool = Field(default=True)
    message: str = Field(..., description="Response from Gemini")
    error: str | None = Field(default=None, description="Error message if request failed")
