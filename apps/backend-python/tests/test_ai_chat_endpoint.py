"""Tests for AI chat endpoint."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


class TestChatEndpoint:
    """Test POST /api/ai/chat endpoint."""

    def test_chat_requires_authentication(self, client: TestClient):
        """Chat endpoint requires valid JWT."""
        response = client.post("/api/ai/chat", json={"message": "Hello"})

        assert response.status_code == 401

    def test_chat_with_valid_token(self, client: TestClient, auth_headers: dict):
        """Chat endpoint accepts valid JWT."""
        with patch("src.routes.ai.chat_with_gemini") as mock_chat:
            mock_chat.return_value = ("Response", [], ([], [], []))

            response = client.post(
                "/api/ai/chat",
                json={"message": "Hello"},
                headers=auth_headers,
            )

            assert response.status_code == 200
            assert response.json()["success"] is True

    def test_chat_validates_input_schema(self, client: TestClient, auth_headers: dict):
        """Chat endpoint validates request schema."""
        response = client.post(
            "/api/ai/chat",
            json={"message": ""},  # Empty message
            headers=auth_headers,
        )

        assert response.status_code == 422  # Validation error

    def test_chat_returns_ai_response(self, client: TestClient, auth_headers: dict):
        """Chat endpoint returns AI message."""
        expected_message = "I'll help you with that task."

        with patch("src.routes.ai.chat_with_gemini") as mock_chat:
            mock_chat.return_value = (expected_message, [], ([], [], []))

            response = client.post(
                "/api/ai/chat",
                json={"message": "Create a task"},
                headers=auth_headers,
            )

            data = response.json()
            assert data["message"] == expected_message

    def test_chat_returns_executed_commands(self, client: TestClient, auth_headers: dict):
        """Chat endpoint returns list of executed commands."""
        with patch("src.routes.ai.chat_with_gemini") as mock_chat:
            mock_chat.return_value = (
                "Task created",
                [{"action": "CREATE_TASK", "title": "New Task"}],
                (["task-1"], [], []),
            )

            response = client.post(
                "/api/ai/chat",
                json={"message": "Create a task"},
                headers=auth_headers,
            )

            data = response.json()
            assert data["commands_executed"] == ["CREATE_TASK"]
            assert data["created_tasks"] == ["task-1"]

    def test_chat_handles_gemini_api_key_error(
        self, client: TestClient, auth_headers: dict
    ):
        """Chat endpoint maps API key errors to 400."""
        with patch("src.routes.ai.chat_with_gemini") as mock_chat:
            error = Exception("API_KEY_INVALID")
            error.status_code = 401
            mock_chat.side_effect = error

            response = client.post(
                "/api/ai/chat",
                json={"message": "Hello"},
                headers=auth_headers,
            )

            assert response.status_code == 400

    def test_chat_handles_rate_limit_error(
        self, client: TestClient, auth_headers: dict
    ):
        """Chat endpoint maps rate limit errors to 429."""
        with patch("src.routes.ai.chat_with_gemini") as mock_chat:
            error = Exception("Rate limited")
            error.status_code = 429
            mock_chat.side_effect = error

            response = client.post(
                "/api/ai/chat",
                json={"message": "Hello"},
                headers=auth_headers,
            )

            assert response.status_code == 429
            assert "cuota" in response.json()["detail"].lower()

    def test_chat_handles_service_unavailable(
        self, client: TestClient, auth_headers: dict
    ):
        """Chat endpoint maps service unavailable to 503."""
        with patch("src.routes.ai.chat_with_gemini") as mock_chat:
            error = Exception("Service unavailable")
            error.status_code = 503
            mock_chat.side_effect = error

            response = client.post(
                "/api/ai/chat",
                json={"message": "Hello"},
                headers=auth_headers,
            )

            assert response.status_code == 503



class TestChatCommandExecution:
    """Test task creation from chat commands."""

    def test_chat_creates_task_from_command(self, client: TestClient, auth_headers: dict):
        """Chat endpoint creates task from AI command."""
        with patch("src.routes.ai.chat_with_gemini") as mock_chat:
            mock_chat.return_value = (
                "Task created successfully",
                [{"action": "CREATE_TASK", "title": "Learn FastAPI"}],
                (["task-123"], [], []),
            )

            response = client.post(
                "/api/ai/chat",
                json={"message": "Create a task to learn FastAPI"},
                headers=auth_headers,
            )

            data = response.json()
            assert data["success"] is True
            assert "Learn FastAPI" not in data["message"]  # Command removed
            assert "task-123" in data["created_tasks"]

    def test_chat_returns_empty_lists_for_no_commands(
        self, client: TestClient, auth_headers: dict
    ):
        """Chat endpoint returns empty lists when no commands executed."""
        with patch("src.routes.ai.chat_with_gemini") as mock_chat:
            mock_chat.return_value = (
                "I can help you with that.",
                [],
                ([], [], []),
            )

            response = client.post(
                "/api/ai/chat",
                json={"message": "What can you help with?"},
                headers=auth_headers,
            )

            data = response.json()
            assert data["created_tasks"] == []
            assert data["updated_tasks"] == []
            assert data["deleted_tasks"] == []
