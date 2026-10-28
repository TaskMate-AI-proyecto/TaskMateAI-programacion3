import os
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration from environment variables."""

    # Server
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", 8000))
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql://user:password@localhost:5432/taskmate"
    )

    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # Gemini API
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = "gemini-2.5-flash"
    gemini_max_retries: int = 3
    gemini_retry_delay_ms: int = 500

    # CORS
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Environment
    environment: Literal["development", "staging", "production"] = os.getenv(
        "ENVIRONMENT", "development"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
