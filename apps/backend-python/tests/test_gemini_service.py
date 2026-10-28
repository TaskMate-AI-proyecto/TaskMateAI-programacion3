"""Tests for Gemini service."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.services.gemini import (
    extract_commands_from_response,
    _create_task_from_command,
    _delete_task_from_command,
    get_gemini_error_response,
)
from src.models import Status, Priority, Task


class TestCommandExtraction:
    """Test command extraction from Gemini responses."""

    def test_extract_single_command(self):
        """Extract single command from response."""
        response = 'Sure! [COMMAND]{"action":"CREATE_TASK","title":"Learn Python"}[/COMMAND] Done!'
        text, commands = extract_commands_from_response(response)

        assert "Done!" in text
        assert "COMMAND" not in text
        assert len(commands) == 1
        assert commands[0]["action"] == "CREATE_TASK"
        assert commands[0]["title"] == "Learn Python"

    def test_extract_multiple_commands(self):
        """Extract multiple commands from response."""
        response = '[COMMAND]{"action":"CREATE_TASK","title":"Task 1"}[/COMMAND] and [COMMAND]{"action":"CREATE_TASK","title":"Task 2"}[/COMMAND]'
        text, commands = extract_commands_from_response(response)

        assert len(commands) == 2
        assert commands[0]["title"] == "Task 1"
        assert commands[1]["title"] == "Task 2"

    def test_handles_malformed_json(self):
        """Handle malformed JSON gracefully."""
        response = '[COMMAND]{invalid json}[/COMMAND] Continue normally'
        text, commands = extract_commands_from_response(response)

        assert "Continue normally" in text
        assert len(commands) == 0  # Invalid JSON skipped

    def test_handles_no_commands(self):
        """Handle response with no commands."""
        response = "Just a normal response without any commands."
        text, commands = extract_commands_from_response(response)

        assert text == response
        assert len(commands) == 0

    def test_strips_command_markers(self):
        """Command markers are stripped from text."""
        response = 'Text [COMMAND]{"action":"CREATE_TASK","title":"Task"}[/COMMAND] more text'
        text, commands = extract_commands_from_response(response)

        assert "[COMMAND]" not in text
        assert "[/COMMAND]" not in text
        assert "Text" in text
        assert "more text" in text


class TestTaskCreationFromCommand:
    """Test task creation from command."""

    def test_creates_task_with_required_fields(self, db, test_user):
        """Create task with only required fields."""
        command = {"title": "New Task"}
        task_id = _create_task_from_command(command, test_user.id, db)

        assert task_id is not None
        task = db.query(Task).filter(Task.id == task_id).first()
        assert task is not None
        assert task.title == "New Task"
        assert task.status == Status.PENDING
        assert task.priority == Priority.MEDIUM

    def test_creates_task_with_all_fields(self, db, test_user, test_category):
        """Create task with all fields."""
        command = {
            "title": "Complete Task",
            "description": "Full description",
            "priority": "HIGH",
            "categoryId": test_category.id,
        }
        task_id = _create_task_from_command(command, test_user.id, db)

        assert task_id is not None
        task = db.query(Task).filter(Task.id == task_id).first()
        assert task.title == "Complete Task"
        assert task.description == "Full description"
        assert task.priority == Priority.HIGH
        assert task.category_id == test_category.id

    def test_rejects_empty_title(self, db, test_user):
        """Reject command with empty title."""
        command = {"title": "   "}  # Whitespace only
        task_id = _create_task_from_command(command, test_user.id, db)

        assert task_id is None

    def test_handles_invalid_priority(self, db, test_user):
        """Handle invalid priority with default."""
        command = {"title": "Task", "priority": "INVALID"}
        task_id = _create_task_from_command(command, test_user.id, db)

        assert task_id is not None
        task = db.query(Task).filter(Task.id == task_id).first()
        assert task.priority == Priority.MEDIUM  # Default


class TestTaskDeletion:
    """Test task deletion from command."""

    def test_deletes_existing_task(self, db, test_user, test_task):
        """Delete existing task."""
        result = _delete_task_from_command(test_task.id, test_user.id, db)

        assert result is True
        assert db.query(Task).filter(Task.id == test_task.id).first() is None

    def test_rejects_nonexistent_task(self, db, test_user):
        """Reject deletion of non-existent task."""
        result = _delete_task_from_command("nonexistent", test_user.id, db)

        assert result is False

    def test_rejects_other_user_task(self, db, test_user, test_task):
        """Reject deletion of other user's task."""
        other_user_id = "other-user-123"
        result = _delete_task_from_command(test_task.id, other_user_id, db)

        assert result is False
        assert db.query(Task).filter(Task.id == test_task.id).first() is not None


class TestErrorMapping:
    """Test Gemini error mapping."""

    def test_maps_401_to_invalid_key(self):
        """Map 401 status to invalid key error."""
        error = Exception("API key invalid")
        error.status_code = 401
        status, message = get_gemini_error_response(error)

        assert status == 400
        assert "clave" in message.lower()

    def test_maps_429_to_rate_limit(self):
        """Map 429 status to rate limit error."""
        error = Exception("Rate limited")
        error.status_code = 429
        status, message = get_gemini_error_response(error)

        assert status == 429
        assert "cuota" in message.lower()

    def test_maps_503_to_unavailable(self):
        """Map 503 status to unavailable error."""
        error = Exception("Service unavailable")
        error.status_code = 503
        status, message = get_gemini_error_response(error)

        assert status == 503
        assert "disponible" in message.lower()

    def test_maps_unknown_to_500(self):
        """Map unknown errors to 500."""
        error = Exception("Unknown error")
        status, message = get_gemini_error_response(error)

        assert status == 500
        assert "No se pudo completar" in message
