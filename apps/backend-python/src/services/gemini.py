import asyncio
import json
import re
import time
from typing import TypedDict, Optional, List
from datetime import datetime, timedelta

import google.generativeai as genai
from sqlalchemy.orm import Session

from src.config.env import settings
from src.models import Task, Status, Priority


class CommandPayload(TypedDict, total=False):
    """Command payload structure."""

    action: str
    id: Optional[str]
    title: Optional[str]
    description: Optional[str]
    priority: Optional[str]
    status: Optional[str]
    dueDate: Optional[str]
    categoryId: Optional[str]


class GeminiError(Exception):
    """Gemini service error."""

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def get_gemini_error_response(error: Exception) -> tuple[int, str]:
    """Map Gemini errors to HTTP status codes."""
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


async def call_gemini_with_retry(prompt: str) -> str:
    """Call Gemini API with exponential backoff retry."""
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    last_error: Optional[Exception] = None
    delay_ms = settings.gemini_retry_delay_ms

    for attempt in range(settings.gemini_max_retries):
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as error:
            last_error = error
            error_message = str(error)

            is_transient = (
                hasattr(error, "status_code") and error.status_code in (429, 500, 502, 503, 504)
                or any(code in error_message for code in ("ECONNRESET", "ETIMEDOUT", "ENETUNREACH"))
            )

            if not is_transient or attempt == settings.gemini_max_retries - 1:
                break

            await asyncio.sleep(delay_ms / 1000)
            delay_ms *= 2

    if last_error:
        raise last_error
    raise GeminiError(500, "No se pudo completar la solicitud con Gemini.")


def extract_commands_from_response(text: str) -> tuple[str, List[CommandPayload]]:
    """Extract commands from Gemini response marked with [COMMAND]...[/COMMAND]."""
    commands: List[CommandPayload] = []
    clean_text = text

    pattern = r"\[COMMAND\](.*?)\[/COMMAND\]"
    matches = re.findall(pattern, text, re.DOTALL)

    for match in matches:
        try:
            match_str = match.strip()
            command_obj = json.loads(match_str)
            if isinstance(command_obj, dict):
                commands.append(command_obj)
        except json.JSONDecodeError:
            pass

    clean_text = re.sub(pattern, "", clean_text, flags=re.DOTALL).strip()

    return clean_text, commands


async def execute_commands(
    commands: List[CommandPayload], user_id: str, db: Session
) -> tuple[List[str], List[str], List[str]]:
    """Execute extracted commands."""
    created_task_ids: List[str] = []
    updated_task_ids: List[str] = []
    deleted_task_ids: List[str] = []

    for command in commands:
        action = command.get("action", "").upper()

        if action == "CREATE_TASK":
            task_id = _create_task_from_command(command, user_id, db)
            if task_id:
                created_task_ids.append(task_id)

        elif action == "UPDATE_TASK":
            task_id = command.get("id")
            if task_id and _update_task_from_command(command, user_id, db):
                updated_task_ids.append(task_id)

        elif action == "DELETE_TASK":
            task_id = command.get("id")
            if task_id and _delete_task_from_command(task_id, user_id, db):
                deleted_task_ids.append(task_id)

    return created_task_ids, updated_task_ids, deleted_task_ids


def _create_task_from_command(command: CommandPayload, user_id: str, db: Session) -> Optional[str]:
    """Create task from command."""
    title = command.get("title", "").strip()
    if not title:
        return None

    description = command.get("description", "").strip() or None
    priority_str = command.get("priority", "MEDIUM").upper()
    status_str = command.get("status", "PENDING").upper()

    try:
        priority = Priority[priority_str] if priority_str in Priority.__members__ else Priority.MEDIUM
        status = Status[status_str] if status_str in Status.__members__ else Status.PENDING
    except (KeyError, ValueError):
        priority = Priority.MEDIUM
        status = Status.PENDING

    due_date = None
    due_date_str = command.get("dueDate")
    if due_date_str:
        try:
            due_date = datetime.fromisoformat(due_date_str)
        except (ValueError, TypeError):
            pass

    task = Task(
        title=title,
        description=description,
        priority=priority,
        status=status,
        due_date=due_date,
        user_id=user_id,
        category_id=command.get("categoryId"),
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task.id


def _update_task_from_command(command: CommandPayload, user_id: str, db: Session) -> bool:
    """Update task from command."""
    task_id = command.get("id")
    if not task_id:
        return False

    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        return False

    if "status" in command:
        status_str = str(command["status"]).upper()
        task.status = Status[status_str] if status_str in Status.__members__ else task.status

    if "priority" in command:
        priority_str = str(command["priority"]).upper()
        task.priority = Priority[priority_str] if priority_str in Priority.__members__ else task.priority

    if "title" in command:
        title = str(command["title"]).strip()
        if title:
            task.title = title

    if "description" in command:
        task.description = str(command["description"]).strip() or None

    if "dueDate" in command:
        try:
            task.due_date = datetime.fromisoformat(str(command["dueDate"]))
        except (ValueError, TypeError):
            pass

    db.commit()
    return True


def _delete_task_from_command(task_id: str, user_id: str, db: Session) -> bool:
    """Delete task from command."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        return False

    db.delete(task)
    db.commit()
    return True


async def chat_with_gemini(
    message: str, user_id: str, db: Session
) -> tuple[str, List[CommandPayload], tuple[List[str], List[str], List[str]]]:
    """Send message to Gemini and process response with commands."""
    user_tasks = db.query(Task).filter(Task.user_id == user_id).all()

    task_context = ""
    if user_tasks:
        task_lines = []
        for task in user_tasks:
            due_date_str = task.due_date.isoformat() if task.due_date else "Sin fecha"
            task_lines.append(
                f"- {task.title} | Estado: {task.status.value} | Prioridad: {task.priority.value if task.priority else 'Sin prioridad'} | Vence: {due_date_str}"
            )
        task_context = "\n".join(task_lines)
    else:
        task_context = "No hay tareas registradas."

    system_prompt = f"""Eres un asistente inteligente de gestión de tareas.
Ayuda al usuario a gestionar sus tareas de forma conversacional.
Cuando el usuario solicite crear, actualizar o eliminar una tarea,
incluye un comando JSON dentro de [COMMAND]...[/COMMAND] markers.

Tareas actuales del usuario:
{task_context}

Comandos disponibles:
1. CREATE_TASK: {{"action":"CREATE_TASK","title":"string","description":"string","priority":"LOW|MEDIUM|HIGH","status":"PENDING|IN_PROGRESS|COMPLETED","dueDate":"ISO-8601","categoryId":"string"}}
2. UPDATE_TASK: {{"action":"UPDATE_TASK","id":"task_id","status":"NEW_STATUS","priority":"NEW_PRIORITY","title":"NEW_TITLE"}}
3. DELETE_TASK: {{"action":"DELETE_TASK","id":"task_id"}}

Responde en español de manera conversacional. Solo incluye comandos cuando sea apropiado."""

    full_prompt = f"{system_prompt}\n\nUsuario: {message}"

    response_text = await call_gemini_with_retry(full_prompt)
    clean_response, commands = extract_commands_from_response(response_text)
    execution_result = await execute_commands(commands, user_id, db)

    return clean_response, commands, execution_result
