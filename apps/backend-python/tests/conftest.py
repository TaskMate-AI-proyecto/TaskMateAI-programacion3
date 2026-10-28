"""Pytest configuration and fixtures."""

import asyncio
from datetime import datetime, timedelta
from typing import Generator
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from src.config.env import settings
from src.models import Base, User, Task, Category, Status, Priority
from src.services.database import get_db
from src.utils.security import create_access_token
from app import create_app


# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a test database and drop all tables after test."""
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session, monkeypatch) -> TestClient:
    """Create FastAPI test client with overridden database."""
    # Set a dummy Gemini API key for tests
    monkeypatch.setenv("GEMINI_API_KEY", "test-api-key-12345")

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user = User(id="test-user-1", email="test@example.com")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_category(db: Session, test_user: User) -> Category:
    """Create a test category."""
    category = Category(
        id="test-category-1",
        name="Test Category",
        color="#FF0000",
        user_id=test_user.id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_task(db: Session, test_user: User, test_category: Category) -> Task:
    """Create a test task."""
    task = Task(
        id="test-task-1",
        title="Test Task",
        description="Test task description",
        status=Status.PENDING,
        priority=Priority.MEDIUM,
        due_date=datetime.utcnow() + timedelta(days=1),
        user_id=test_user.id,
        category_id=test_category.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@pytest.fixture
def jwt_token(test_user: User) -> str:
    """Create a valid JWT token for test user."""
    return create_access_token({"id": test_user.id, "email": test_user.email})


@pytest.fixture
def auth_headers(jwt_token: str) -> dict:
    """Create authorization headers with JWT token."""
    return {"Authorization": f"Bearer {jwt_token}"}


@pytest.fixture
def mock_gemini():
    """Create a mocked Gemini service."""
    with patch("src.services.gemini.genai") as mock:
        yield mock
