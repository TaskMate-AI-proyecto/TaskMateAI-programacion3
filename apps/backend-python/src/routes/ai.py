from typing import List, Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.config.env import settings
from src.models import Task, User
from src.schemas.ai import ChatRequest, ChatResponse, ErrorResponse
from src.services.gemini import chat_with_gemini, get_gemini_error_response, GeminiError
from src.services.database import get_db
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
    2. Call Gemini with user message + context of user's tasks
    3. Extract [COMMAND] blocks from response
    4. Parse and validate commands
    5. Execute valid commands (create/update tasks)
    6. Return response with generated message + executed commands

    Errors:
    - 400: Invalid input, missing fields, invalid Gemini API key
    - 401: Unauthorized
    - 429: Gemini rate limit
    - 503: Gemini unavailable
    """
    try:
        message, commands, (created_ids, updated_ids, deleted_ids) = await chat_with_gemini(
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

    except GeminiError as e:
        status_code, error_message = get_gemini_error_response(e)
        raise HTTPException(status_code=status_code, detail=error_message)
    except Exception as e:
        status_code, error_message = get_gemini_error_response(e)
        raise HTTPException(status_code=status_code, detail=error_message)
