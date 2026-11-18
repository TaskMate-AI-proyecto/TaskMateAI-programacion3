"""Tests for Groq retry logic, command execution and the chat flow."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models import Priority, Status, Task
from src.services.groq import (
    GroqError,
    _create_task_from_command,
    _update_task_from_command,
    call_groq_with_retry,
    chat_with_groq,
    execute_commands,
)


def _error(message: str, status_code: int | None = None) -> Exception:
    error = Exception(message)
    if status_code is not None:
        error.status_code = status_code
    return error


def _responding(*outcomes) -> AsyncMock:
    """Fake de la llamada HTTP a Groq: devuelve o lanza cada resultado en orden."""
    return AsyncMock(side_effect=list(outcomes))


class TestCallGroqWithRetry:
    async def test_returns_text_from_first_successful_attempt(self):
        request = _responding("respuesta")

        with patch("src.services.groq._request_completion", new=request):
            assert await call_groq_with_retry("hola") == "respuesta"
            assert request.await_count == 1

    async def test_retries_transient_status_then_succeeds(self):
        request = _responding(_error("busy", 503), "listo")

        with patch("src.services.groq._request_completion", new=request), patch(
            "src.services.groq.asyncio.sleep", new=AsyncMock()
        ) as sleep:
            assert await call_groq_with_retry("hola") == "listo"
            assert request.await_count == 2
            sleep.assert_awaited_once()

    async def test_retries_transient_network_error_code(self):
        request = _responding(_error("socket ECONNRESET"), "listo")

        with patch("src.services.groq._request_completion", new=request), patch(
            "src.services.groq.asyncio.sleep", new=AsyncMock()
        ):
            assert await call_groq_with_retry("hola") == "listo"

    async def test_does_not_retry_non_transient_errors(self):
        request = _responding(_error("bad request", 400))

        with patch("src.services.groq._request_completion", new=request), patch(
            "src.services.groq.asyncio.sleep", new=AsyncMock()
        ) as sleep:
            with pytest.raises(Exception, match="bad request"):
                await call_groq_with_retry("hola")

            assert request.await_count == 1
            sleep.assert_not_awaited()

    async def test_gives_up_after_max_retries_with_last_error(self):
        request = _responding(_error("busy", 503), _error("busy", 503), _error("busy", 503))

        with patch("src.services.groq._request_completion", new=request), patch(
            "src.services.groq.asyncio.sleep", new=AsyncMock()
        ):
            with pytest.raises(Exception, match="busy"):
                await call_groq_with_retry("hola")

            assert request.await_count == 3


class TestCommandExecution:
    def test_create_task_defaults_invalid_priority_and_status(self, db: Session, test_user):
        task_id = _create_task_from_command(
            {"title": "Tarea", "priority": "URGENTE", "status": "RARO"}, test_user.id, db
        )

        task = db.query(Task).filter(Task.id == task_id).first()
        assert task.priority == Priority.MEDIUM
        assert task.status == Status.PENDING

    def test_create_task_ignores_unparseable_due_date(self, db: Session, test_user):
        task_id = _create_task_from_command(
            {"title": "Tarea", "dueDate": "no-es-fecha"}, test_user.id, db
        )

        assert db.query(Task).filter(Task.id == task_id).first().due_date is None

    def test_create_task_stores_parsed_due_date_and_blank_description_as_none(self, db: Session, test_user):
        task_id = _create_task_from_command(
            {"title": "Tarea", "dueDate": "2030-05-01T10:00:00", "description": "   "}, test_user.id, db
        )

        task = db.query(Task).filter(Task.id == task_id).first()
        assert task.due_date == datetime(2030, 5, 1, 10, 0)
        assert task.description is None

    def test_create_task_without_title_is_skipped(self, db: Session, test_user):
        assert _create_task_from_command({"title": "   "}, test_user.id, db) is None

    def test_update_returns_false_for_missing_or_foreign_task(self, db: Session, test_user):
        assert _update_task_from_command({"id": None}, test_user.id, db) is False
        assert _update_task_from_command({"id": "no-existe"}, test_user.id, db) is False

    def test_update_applies_every_supported_field(self, db: Session, test_user, test_task):
        command = {
            "id": test_task.id,
            "status": "COMPLETED",
            "priority": "HIGH",
            "title": "  Nuevo título  ",
            "description": "  Nueva descripción ",
            "dueDate": "2031-01-02T03:04:05",
        }

        assert _update_task_from_command(command, test_user.id, db) is True

        db.refresh(test_task)
        assert test_task.status == Status.COMPLETED
        assert test_task.priority == Priority.HIGH
        assert test_task.title == "Nuevo título"
        assert test_task.description == "Nueva descripción"
        assert test_task.due_date == datetime(2031, 1, 2, 3, 4, 5)

    def test_update_ignores_invalid_values_and_blank_title(self, db: Session, test_user, test_task):
        command = {
            "id": test_task.id,
            "status": "INVENTADO",
            "priority": "INVENTADO",
            "title": "   ",
            "dueDate": "no-es-fecha",
        }

        assert _update_task_from_command(command, test_user.id, db) is True

        db.refresh(test_task)
        assert test_task.status == Status.PENDING
        assert test_task.priority == Priority.MEDIUM
        assert test_task.title == "Test Task"

    def test_update_clears_description_when_blank(self, db: Session, test_user, test_task):
        assert _update_task_from_command({"id": test_task.id, "description": "  "}, test_user.id, db) is True

        db.refresh(test_task)
        assert test_task.description is None

    async def test_execute_commands_reports_created_updated_and_deleted_ids(self, db: Session, test_user, test_task):
        commands = [
            {"action": "create_task", "title": "Nueva"},
            {"action": "UPDATE_TASK", "id": test_task.id, "title": "Cambiada"},
            {"action": "DELETE_TASK", "id": test_task.id},
            {"action": "UPDATE_TASK", "id": None},
            {"action": "DESCONOCIDA"},
        ]

        created, updated, deleted = await execute_commands(commands, test_user.id, db)

        assert len(created) == 1
        assert updated == [test_task.id]
        assert deleted == [test_task.id]


class TestChatWithGroq:
    async def test_builds_prompt_from_user_tasks_and_executes_commands(self, db: Session, test_user, test_task):
        reply = 'Claro, la creo. [COMMAND]{"action":"CREATE_TASK","title":"Estudiar"}[/COMMAND]'

        with patch("src.services.groq.call_groq_with_retry", new=AsyncMock(return_value=reply)) as call:
            message, commands, (created, updated, deleted) = await chat_with_groq(
                "Crea una tarea", test_user.id, db
            )

        prompt = call.await_args.args[0]
        assert "Test Task" in prompt
        assert "Estado: PENDING" in prompt
        assert "Crea una tarea" in prompt
        assert message == "Claro, la creo."
        assert commands[0]["action"] == "CREATE_TASK"
        assert len(created) == 1 and updated == [] and deleted == []

    async def test_reports_no_tasks_and_missing_priority_in_prompt(self, db: Session, test_user):
        task = Task(id="sin-prioridad", title="Libre", status=Status.PENDING, priority=None, user_id=test_user.id)
        db.add(task)
        db.commit()

        with patch("src.services.groq.call_groq_with_retry", new=AsyncMock(return_value="ok")) as call:
            await chat_with_groq("hola", test_user.id, db)

        assert "Sin prioridad" in call.await_args.args[0]
        assert "Sin fecha" in call.await_args.args[0]

        db.query(Task).delete()
        db.commit()

        with patch("src.services.groq.call_groq_with_retry", new=AsyncMock(return_value="ok")) as call:
            await chat_with_groq("hola", test_user.id, db)

        assert "No hay tareas registradas." in call.await_args.args[0]


class TestChatRoute:
    def test_rejects_malformed_authorization_header(self, client: TestClient):
        response = client.post(
            "/api/ai/chat", json={"message": "hola"}, headers={"Authorization": "Basic abc"}
        )

        assert response.status_code == 401

    def test_rejects_invalid_token(self, client: TestClient):
        response = client.post(
            "/api/ai/chat", json={"message": "hola"}, headers={"Authorization": "Bearer no-es-un-jwt"}
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid token"

    def test_maps_groq_error_raised_by_service(self, client: TestClient, auth_headers: dict):
        with patch("src.routes.ai.chat_with_groq", new=AsyncMock(side_effect=GroqError(429, "cuota"))):
            response = client.post("/api/ai/chat", json={"message": "hola"}, headers=auth_headers)

        assert response.status_code == 429
        assert "cuota" in response.json()["detail"].lower()
