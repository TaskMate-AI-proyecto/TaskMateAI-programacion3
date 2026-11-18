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

    # Groq API
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    groq_max_retries: int = 3
    groq_retry_delay_ms: int = 500

    # API Node de la que se lee el historial de tareas (mismo token JWT del usuario).
    node_api_url: str = os.getenv("NODE_API_URL", "http://localhost:3001")

    # CORS
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Environment
    environment: Literal["development", "staging", "production"] = os.getenv(
        "ENVIRONMENT", "development"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False
        # Variables antiguas o de otros servicios (p. ej. GEMINI_API_KEY) no deben impedir el arranque.
        extra = "ignore"


settings = Settings()
