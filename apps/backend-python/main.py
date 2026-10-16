"""Entry point for running the FastAPI application."""

import uvicorn

from src.config.env import settings


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
