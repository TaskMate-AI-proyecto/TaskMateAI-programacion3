from pydantic import BaseModel, EmailStr, Field


class SendCodeRequest(BaseModel):
    """Send verification code request."""

    email: EmailStr


class VerifyCodeRequest(BaseModel):
    """Verify code request."""

    email: EmailStr
    code: str = Field(..., pattern=r"^\d{6}$")


class UserResponse(BaseModel):
    """User response schema."""

    id: str
    email: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response with token."""

    success: bool
    token: str
    user: UserResponse
