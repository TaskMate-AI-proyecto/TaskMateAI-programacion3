from fastapi import APIRouter, HTTPException

from src.schemas.auth import (
    SendCodeRequest,
    SendCodeResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
)
from src.services.auth import handle_send_code, handle_verify_code

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/send-code", response_model=SendCodeResponse)
async def send_code(request: SendCodeRequest) -> SendCodeResponse:
    try:
        result = await handle_send_code(request.email)
        return SendCodeResponse(
            success=result.get("success", False),
            message=result.get("message", "Error"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Error enviando el código",
        )


@router.post("/verify-code", response_model=VerifyCodeResponse)
async def verify_code(request: VerifyCodeRequest) -> VerifyCodeResponse:
    try:
        result = await handle_verify_code(request.email, request.code)

        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Código inválido o expirado"),
            )

        return VerifyCodeResponse(
            success=result.get("success", False),
            token=result.get("token", ""),
            user=result.get("user", {}),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Error verificando el código",
        )
