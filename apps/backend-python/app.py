"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.env import settings
from src.routes import ai_router
from src.services.database import init_db


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="TaskMate AI Backend",
        description="AI-powered task management API",
        version="0.1.0",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Initialize database on startup
    @app.on_event("startup")
    async def startup():
        init_db()

    # Health check endpoints
    @app.get("/health")
    async def health():
        return {"status": "ok"}

    @app.get("/")
    async def root():
        return {"message": "TaskMate AI Backend", "version": "0.1.0"}

    # Include routers
    app.include_router(ai_router)

    return app


app = create_app()
