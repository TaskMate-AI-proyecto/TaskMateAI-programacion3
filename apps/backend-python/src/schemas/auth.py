from pydantic import BaseModel, EmailStr, Field


class SendCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")


class SendCodeResponse(BaseModel):
    success: bool = Field(default=True)
    message: str = Field(..., description="Response message")


class VerifyCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    code: str = Field(..., pattern="^\\d{6}$", description="6-digit verification code")


class UserResponse(BaseModel):
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")


class VerifyCodeResponse(BaseModel):
    success: bool = Field(default=True)
    token: str = Field(..., description="JWT authentication token")
    user: UserResponse = Field(..., description="User information")
