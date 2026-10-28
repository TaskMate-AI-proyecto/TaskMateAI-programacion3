from fastapi import APIRouter, HTTPException, Depends
from src.schemas.chat import ChatRequest, ChatResponse
from src.services.gemini import chat_with_gemini
from src.config.settings import settings

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
        raise HTTPException(
            status_code=400,
            detail="Gemini API key not configured",
        )

    try:
        response = await chat_with_gemini(request.message, request.history)
        return ChatResponse(success=True, message=response)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="No se pudo completar la solicitud",
        )
