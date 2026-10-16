from typing import Dict, Tuple


def failure(status_code: int, message: str) -> Dict[str, any]:
    """Create failure response."""
    return {"success": False, "message": message}


def get_gemini_error_response(error: Exception) -> Tuple[int, str]:
    """Map Gemini errors to HTTP status and message."""
    error_message = str(error)

    if "API_KEY_INVALID" in error_message or "API key not valid" in error_message:
        return (400, "La clave de la API de Gemini no es válida.")

    if hasattr(error, "status_code"):
        status = error.status_code
        if status in (401, 403):
            return (400, "La clave de la API de Gemini no es válida.")
        if status == 429:
            return (429, "Se agotó la cuota de Gemini. Intente nuevamente en unos minutos.")
        if status == 503:
            return (503, "Gemini no está disponible temporalmente. Intente nuevamente más tarde.")

    return (500, "No se pudo completar la solicitud con Gemini.")
