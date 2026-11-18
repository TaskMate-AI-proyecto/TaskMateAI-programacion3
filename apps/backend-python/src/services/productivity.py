"""Métricas de productividad y resumen ejecutivo generado con Groq."""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable

from src.services.groq import call_groq_with_retry
from src.services.tasks_client import TaskSnapshot

WEEK = timedelta(days=7)
PRIORITY_LABELS = {"HIGH": "Alta", "MEDIUM": "Media", "LOW": "Baja"}
MAX_TASKS_IN_PROMPT = 25


@dataclass(frozen=True)
class PriorityBreakdown:
    label: str
    total: int
    completed: int

    @property
    def rate(self) -> float:
        return percent(self.completed, self.total)


@dataclass(frozen=True)
class ProductivityMetrics:
    total: int
    completed: int
    pending: int
    in_progress: int
    in_review: int
    overdue: int
    week_created: int
    week_completed: int
    high_priority: PriorityBreakdown

    @property
    def completion_rate(self) -> float:
        return percent(self.completed, self.total)


def percent(part: int, whole: int) -> float:
    """Porcentaje con un decimal; 0 si no hay datos."""
    return round(part * 100 / whole, 1) if whole else 0.0


def parse_date(value: str | None) -> datetime | None:
    """Convierte fechas ISO-8601 de la API (con sufijo Z) a datetime con zona horaria."""
    if not value:
        return None

    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    # Node siempre envía UTC; una fecha sin zona horaria se interpreta como UTC.
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _is_within_week(value: str | None, now: datetime) -> bool:
    parsed = parse_date(value)
    return parsed is not None and now - WEEK <= parsed <= now


def _is_overdue(task: TaskSnapshot, now: datetime) -> bool:
    due = parse_date(task.dueDate)
    return task.status != "COMPLETED" and due is not None and due < now


def _priority_breakdown(tasks: list[TaskSnapshot], priority: str) -> PriorityBreakdown:
    matching = [task for task in tasks if task.priority == priority]
    completed = sum(1 for task in matching if task.status == "COMPLETED")

    return PriorityBreakdown(PRIORITY_LABELS[priority], len(matching), completed)


def compute_metrics(tasks: list[TaskSnapshot], now: datetime) -> ProductivityMetrics:
    """Calcula los indicadores del reporte a partir del historial de tareas."""
    count = {status: sum(1 for task in tasks if task.status == status) for status in ("PENDING", "IN_PROGRESS", "IN_REVIEW", "COMPLETED")}

    return ProductivityMetrics(
        total=len(tasks),
        completed=count["COMPLETED"],
        pending=count["PENDING"],
        in_progress=count["IN_PROGRESS"],
        in_review=count["IN_REVIEW"],
        overdue=sum(1 for task in tasks if _is_overdue(task, now)),
        week_created=sum(1 for task in tasks if _is_within_week(task.createdAt, now)),
        week_completed=sum(
            1 for task in tasks if task.status == "COMPLETED" and _is_within_week(task.updatedAt, now)
        ),
        high_priority=_priority_breakdown(tasks, "HIGH"),
    )


def _age_in_days(task: TaskSnapshot, now: datetime) -> int:
    created = parse_date(task.createdAt)
    return (now - created).days if created else 0


def _task_line(task: TaskSnapshot, now: datetime) -> str:
    due = task.dueDate[:10] if task.dueDate else "sin fecha"
    priority = PRIORITY_LABELS.get(task.priority, task.priority)

    return f"- [{priority}] {task.title} (estado {task.status}, creada hace {_age_in_days(task, now)} días, vence: {due})"


def _open_task_lines(tasks: Iterable[TaskSnapshot], now: datetime) -> list[str]:
    open_tasks = [task for task in tasks if task.status != "COMPLETED"]
    oldest_first = sorted(open_tasks, key=lambda task: _age_in_days(task, now), reverse=True)

    return [_task_line(task, now) for task in oldest_first[:MAX_TASKS_IN_PROMPT]]


def build_prompt(metrics: ProductivityMetrics, tasks: list[TaskSnapshot], now: datetime) -> str:
    """Prompt para Groq: datos reales del usuario y el formato exacto del resumen."""
    lines = [
        "Eres el analista de productividad de TaskMate AI. Escribe en español, sin Markdown, sin asteriscos ni almohadillas.",
        "Datos del usuario:",
        f"- Tareas totales: {metrics.total}; completadas: {metrics.completed} ({metrics.completion_rate}%).",
        f"- Pendientes: {metrics.pending}; en progreso: {metrics.in_progress}; en revisión: {metrics.in_review}.",
        f"- Vencidas sin completar: {metrics.overdue}.",
        f"- Última semana: {metrics.week_created} tareas creadas y {metrics.week_completed} completadas.",
        f"- Completaste el {metrics.high_priority.rate}% de tareas de prioridad Alta ({metrics.high_priority.completed} de {metrics.high_priority.total}).",
        "Tareas abiertas (de la más antigua a la más reciente):",
        *(_open_task_lines(tasks, now) or ["- No hay tareas abiertas."]),
        "",
        "Responde exactamente con tres secciones y este formato:",
        "DIAGNÓSTICO: un párrafo con el desempeño semanal, citando el porcentaje de prioridad Alta.",
        "PATRONES: un párrafo que identifique procrastinación o cuellos de botella (tareas viejas, vencidas o sin avanzar).",
        "RECOMENDACIONES:",
        "1. recomendación personalizada",
        "2. recomendación personalizada",
        "3. recomendación personalizada",
    ]

    return "\n".join(lines)


def sanitize_summary(text: str) -> str:
    """Quita marcas Markdown que Groq pueda añadir pese a la instrucción."""
    cleaned = text.replace("**", "").replace("__", "")

    return "\n".join(line.lstrip("#").strip() for line in cleaned.splitlines() if line.strip())


async def write_summary(metrics: ProductivityMetrics, tasks: list[TaskSnapshot], now: datetime) -> str:
    """Pide a Groq el resumen ejecutivo del historial."""
    text = await call_groq_with_retry(build_prompt(metrics, tasks, now))

    return sanitize_summary(text)
