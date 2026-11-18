"""Lectura del historial de tareas desde la API Node, con el mismo token JWT del usuario."""

import json
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

from pydantic import BaseModel

from src.config.env import settings

TASKS_TIMEOUT_SECONDS = 10


class TaskSnapshot(BaseModel):
    """Tarea tal como la devuelve la API Node (fechas en ISO-8601)."""

    id: str
    title: str
    status: str
    priority: str
    dueDate: str | None = None
    createdAt: str | None = None
    updatedAt: str | None = None


class TaskHistoryError(Exception):
    """No se pudo leer el historial de tareas del usuario."""

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def fetch_user_tasks(token: str) -> list[TaskSnapshot]:
    """Pide al backend Node las tareas del usuario (propias y compartidas)."""
    url = f"{settings.node_api_url.rstrip('/')}/api/tasks"
    req = urlrequest.Request(url, headers={"Authorization": f"Bearer {token}"})

    try:
        with urlrequest.urlopen(req, timeout=TASKS_TIMEOUT_SECONDS) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        status = 401 if error.code == 401 else 503
        raise TaskHistoryError(status, "No se pudo leer tu historial de tareas.") from error
    except (URLError, TimeoutError, ValueError) as error:
        raise TaskHistoryError(503, "El servicio de tareas no está disponible.") from error

    return [TaskSnapshot.model_validate(item) for item in payload]
