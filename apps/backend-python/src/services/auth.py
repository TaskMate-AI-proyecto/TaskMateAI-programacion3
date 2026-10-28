import secrets
import uuid
from datetime import datetime, timedelta

import jwt
from sqlalchemy.orm import Session

from src.config.database import SessionLocal
from src.config.settings import settings
from src.models import User, VerificationCode


def generate_verification_code() -> str:
    return str(int(secrets.token_hex(3), 16) % 1000000).zfill(6)


def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def send_verification_code_email(email: str, code: str) -> None:
    """Send verification code via email. Currently a no-op for development."""
    print(f"📧 Código de verificación para {email}: {code}")


async def handle_send_code(email: str) -> dict[str, bool | str]:
    db = SessionLocal()
    try:
        code = generate_verification_code()
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        user = db.query(User).filter(User.email == email).first()

        db.query(VerificationCode).filter(
            VerificationCode.email == email, VerificationCode.used == False
        ).update({"used": True})
        db.commit()

        verification_code = VerificationCode(
            id=str(uuid.uuid4()),
            email=email,
            code=code,
            expires_at=expires_at,
            used=False,
            user_id=user.id if user else None,
        )
        db.add(verification_code)
        db.commit()

        send_verification_code_email(email, code)

        return {"success": True, "message": "Código de verificación enviado con éxito"}
    finally:
        db.close()


async def handle_verify_code(email: str, code: str) -> dict[str, bool | str | dict]:
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        verification_code = (
            db.query(VerificationCode)
            .filter(
                VerificationCode.email == email,
                VerificationCode.code == code,
                VerificationCode.used == False,
                VerificationCode.expires_at > now,
            )
            .first()
        )

        if not verification_code:
            return {"success": False, "error": "Código inválido o expirado"}

        verification_code.used = True
        db.commit()

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password_hash="",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_jwt_token(user.id, user.email)

        return {
            "success": True,
            "token": token,
            "user": {"id": user.id, "email": user.email},
        }
    finally:
        db.close()
