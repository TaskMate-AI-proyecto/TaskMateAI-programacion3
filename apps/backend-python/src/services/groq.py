import asyncio
import json
import re
from typing import TypedDict, Optional, List
from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from src.config.env import settings
from src.models import Task, Status, Priority
from src.utils.errors import get_groq_error_response  # noqa: F401 (reexportada para los llamadores)

# Groq expone chat completions compatible con OpenAI.
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
REQUEST_TIMEOUT_SECONDS = 30.0
TRANSIENT_STATUS_CODES = (429, 500, 502, 503, 504)
TRANSIENT_NETWORK_CODES = ("ECONNRESET", "ETIMEDOUT", "ENETUNREACH")


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


class GroqError(Exception):
    """Groq service error."""

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


# Formato de las respuestas del asistente: párrafos y listas limpias, sin Markdown crudo.
ANSWER_FORMAT_INSTRUCTION = (
    "Responde usando párrafos separados por una línea en blanco y listas con viñetas o numeradas "
    "en líneas separadas. No uses sintaxis Markdown cruda como doble asterisco (**); escribe en "
    "texto limpio, claro y bien espaciado."
)


def _chat_messages(prompt: str, system: Optional[str]) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": system}] if system else []
    return [*messages, {"role": "user", "content": prompt}]


async def _request_completion(prompt: str, system: Optional[str] = None) -> str:
    """Una llamada a chat completions de Groq. Los fallos HTTP se lanzan con su status."""
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                GROQ_ENDPOINT,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json={
                    "model": settings.groq_model,
                    "messages": _chat_messages(prompt, system),
                    "temperature": 0.4,
                },
            )
    except httpx.HTTPError as error:
        raise GroqError(503, "No se pudo conectar con Groq.") from error

    if response.status_code >= 400:
        raise GroqError(response.status_code, f"Groq respondió con el estado {response.status_code}.")

    return _completion_text(response.json())


def _completion_text(data: dict) -> str:
    """Extrae el texto de la primera opción de la respuesta."""
    try:
        return str(data["choices"][0]["message"]["content"])
    except (KeyError, IndexError, TypeError) as error:
        raise GroqError(500, "Groq devolvió una respuesta inesperada.") from error


def _is_transient(error: Exception) -> bool:
    status = getattr(error, "status_code", None)

    return status in TRANSIENT_STATUS_CODES or any(code in str(error) for code in TRANSIENT_NETWORK_CODES)


async def call_groq_with_retry(prompt: str, system: Optional[str] = None) -> str:
    """Call Groq API with exponential backoff retry."""
    last_error: Optional[Exception] = None
    delay_ms = settings.groq_retry_delay_ms

    for attempt in range(settings.groq_max_retries):
        try:
            return await _request_completion(prompt, system)
        except Exception as error:
            last_error = error

            if not _is_transient(error) or attempt == settings.groq_max_retries - 1:
                break

            await asyncio.sleep(delay_ms / 1000)
            delay_ms *= 2

    if last_error:
        raise last_error
    raise GroqError(500, "No se pudo completar la solicitud con Groq.")


def extract_commands_from_response(text: str) -> tuple[str, List[CommandPayload]]:
    """Extract commands from Groq response marked with [COMMAND]...[/COMMAND]."""
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


async def chat_with_groq(
    message: str, user_id: str, db: Session
) -> tuple[str, List[CommandPayload], tuple[List[str], List[str], List[str]]]:
    """Send message to Groq and process response with commands."""
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

    response_text = await call_groq_with_retry(full_prompt, system=ANSWER_FORMAT_INSTRUCTION)
    clean_response, commands = extract_commands_from_response(response_text)
    execution_result = await execute_commands(commands, user_id, db)

    return clean_response, commands, execution_result
