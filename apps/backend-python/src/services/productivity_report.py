"""Caso de uso del reporte: lee el historial, calcula métricas, pide el resumen a Groq y genera el PDF."""

from dataclasses import asdict
from datetime import datetime, timezone

from starlette.concurrency import run_in_threadpool

from src.services.productivity import compute_metrics, write_summary
from src.services.report_pdf import make_seal, render_report_pdf
from src.services.tasks_client import fetch_user_tasks

NO_HISTORY_SUMMARY = (
    "Todavía no tienes tareas registradas. Crea tus primeras tareas para recibir un diagnóstico de productividad."
)


async def build_productivity_report(token: str, user_id: str, secret: str) -> bytes:
    """Devuelve el PDF del reporte del usuario."""
    now = datetime.now(timezone.utc)
    tasks = await run_in_threadpool(fetch_user_tasks, token)
    metrics = compute_metrics(tasks, now)
    summary = await write_summary(metrics, tasks, now) if tasks else NO_HISTORY_SUMMARY
    payload = {"user_id": user_id, "issued_at": now.isoformat(), "metrics": asdict(metrics), "summary": summary}

    return render_report_pdf(metrics, summary, now, make_seal(payload, secret))
