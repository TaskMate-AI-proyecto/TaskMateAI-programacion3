"""Tests for JWT helpers, error mapping and the database session dependency."""

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from jose import jwt
from sqlalchemy.orm import Session

from src.config.env import settings
from src.services.database import get_db, init_db
from src.utils.errors import failure, get_gemini_error_response
from src.utils.security import JWTPayload, create_access_token, verify_token


class TestJwtHelpers:
    def test_token_uses_default_expiration_when_no_delta_is_given(self):
        token = create_access_token({"id": "user-1", "email": "ana@example.com"})

        claims = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        expires_at = datetime.utcfromtimestamp(claims["exp"])
        expected = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)

        assert abs((expires_at - expected).total_seconds()) < 60

    def test_token_honours_custom_expiration_delta(self):
        token = create_access_token({"id": "user-1", "email": "ana@example.com"}, timedelta(minutes=5))

        claims = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        expires_at = datetime.utcfromtimestamp(claims["exp"])

        assert abs((expires_at - (datetime.utcnow() + timedelta(minutes=5))).total_seconds()) < 60

    def test_verify_returns_payload_for_valid_token(self):
        token = create_access_token({"id": "user-1", "email": "ana@example.com"})

        assert verify_token(token) == JWTPayload(id="user-1", email="ana@example.com")

    def test_verify_rejects_token_without_required_claims(self):
        token = create_access_token({"id": "user-1"})

        assert verify_token(token) is None

    def test_verify_rejects_garbage_and_wrong_signature(self):
        forged = jwt.encode(
            {"id": "user-1", "email": "ana@example.com"}, "otra-clave", algorithm=settings.jwt_algorithm
        )

        assert verify_token("no-es-un-jwt") is None
        assert verify_token(forged) is None


class TestErrorMapping:
    def test_failure_builds_unsuccessful_body(self):
        assert failure(400, "Malo") == {"success": False, "message": "Malo"}

    def test_invalid_key_message_maps_to_400(self):
        status, message = get_gemini_error_response(Exception("API key not valid. Please pass a valid key"))

        assert status == 400
        assert "no es válida" in message

    def test_auth_status_codes_map_to_400(self):
        error = Exception("forbidden")
        error.status_code = 403

        assert get_gemini_error_response(error)[0] == 400

    def test_rate_limit_and_unavailable_keep_their_status(self):
        rate_limited = Exception("rate")
        rate_limited.status_code = 429
        unavailable = Exception("down")
        unavailable.status_code = 503

        assert get_gemini_error_response(rate_limited)[0] == 429
        assert get_gemini_error_response(unavailable)[0] == 503

    def test_unknown_error_maps_to_500(self):
        status, message = get_gemini_error_response(Exception("algo raro"))

        assert status == 500
        assert "No se pudo completar" in message


class TestDatabaseDependency:
    def test_get_db_yields_a_session_and_closes_it(self):
        session = MagicMock(spec=Session)

        with patch("src.services.database.SessionLocal", return_value=session):
            generator = get_db()
            assert next(generator) is session
            session.close.assert_not_called()

            generator.close()

        session.close.assert_called_once()

    def test_init_db_creates_all_tables(self):
        with patch("src.services.database.Base") as base:
            init_db()

        base.metadata.create_all.assert_called_once()
