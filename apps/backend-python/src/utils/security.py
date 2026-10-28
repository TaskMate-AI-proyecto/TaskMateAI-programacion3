from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from pydantic import BaseModel

from src.config.env import settings


class JWTPayload(BaseModel):
    """JWT payload structure."""

    id: str
    email: str


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )

    return encoded_jwt


def verify_token(token: str) -> Optional[JWTPayload]:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("id")
        email = payload.get("email")

        if user_id is None or email is None:
            return None

        return JWTPayload(id=user_id, email=email)
    except JWTError:
        return None
