from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from src.config.env import settings
from src.schemas.ai import ChatRequest, ChatResponse
from src.services.groq import chat_with_groq, get_groq_error_response, GroqError
from src.services.database import get_db
from src.services.productivity_report import build_productivity_report
from src.services.tasks_client import TaskHistoryError
from src.utils.security import JWTPayload, verify_token
from fastapi import Request

router = APIRouter(prefix="/api/ai", tags=["ai"])


def get_current_user(request: Request) -> JWTPayload:
    """Extract and verify JWT token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.replace("Bearer ", "")
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Annotated[JWTPayload, Depends(get_current_user)] = None,
    db: Session = Depends(get_db),
) -> ChatResponse:
    """
    Chat endpoint with AI-powered task command parsing.

    Behavior:
    1. Validate input (Pydantic)
    2. Call Groq with user message + context of user's tasks
    3. Extract [COMMAND] blocks from response
    4. Parse and validate commands
    5. Execute valid commands (create/update tasks)
    6. Return response with generated message + executed commands

    Errors:
    - 400: Invalid input, missing fields, invalid Groq API key
    - 401: Unauthorized
    - 429: Groq rate limit
    - 503: Groq unavailable
    """
    try:
        message, commands, (created_ids, updated_ids, deleted_ids) = await chat_with_groq(
            request.message, current_user.id, db
        )

        return ChatResponse(
            success=True,
            message=message,
            commands_executed=[cmd.get("action", "unknown") for cmd in commands],
            created_tasks=created_ids,
            updated_tasks=updated_ids,
            deleted_tasks=deleted_ids,
        )

    except GroqError as e:
        status_code, error_message = get_groq_error_response(e)
        raise HTTPException(status_code=status_code, detail=error_message)
    except Exception as e:
        status_code, error_message = get_groq_error_response(e)
        raise HTTPException(status_code=status_code, detail=error_message)


def _bearer_token(request: Request) -> str:
    return request.headers.get("Authorization", "").replace("Bearer ", "")


@router.post("/productivity-report")
async def productivity_report(
    request: Request,
    current_user: Annotated[JWTPayload, Depends(get_current_user)] = None,
) -> Response:
    """
    Reporte de productividad en PDF.

    Lee el historial de tareas del usuario (API Node, con su mismo token), pide a Groq un
    resumen ejecutivo y devuelve el PDF con métricas, resumen, hash de auditoría y firma.

    Errores:
    - 401: Token inválido o sin historial accesible
    - 400/429/503: Errores de Groq o del servicio de tareas
    """
    try:
        pdf = await build_productivity_report(
            _bearer_token(request), current_user.id, settings.jwt_secret
        )
    except TaskHistoryError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)
    except Exception as error:
        status_code, error_message = get_groq_error_response(error)
        raise HTTPException(status_code=status_code, detail=error_message)

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="Reporte_Productividad_TaskMate.pdf"'},
    )
