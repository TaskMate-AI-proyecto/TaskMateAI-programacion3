"""Reporte de productividad: métricas, prompt, sello, PDF y endpoint."""

import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest

from src.services import productivity, productivity_report
from src.services.productivity import compute_metrics, build_prompt, sanitize_summary
from src.services.report_pdf import make_seal, render_report_pdf
from src.services.tasks_client import TaskHistoryError, TaskSnapshot
from src.utils.security import create_access_token

NOW = datetime(2026, 11, 11, 12, 0, tzinfo=timezone.utc)


def iso(days: int) -> str:
    return (NOW + timedelta(days=days)).isoformat().replace("+00:00", "Z")


def task(title: str, status: str, priority: str, created: int = -1, due: int | None = None) -> TaskSnapshot:
    return TaskSnapshot(
        id=title,
        title=title,
        status=status,
        priority=priority,
        dueDate=iso(due) if due is not None else None,
        createdAt=iso(created),
        updatedAt=iso(0) if status == "COMPLETED" else iso(created),
    )


SAMPLE = [
    task("Parcial", "COMPLETED", "HIGH"),
    task("Entrega", "PENDING", "HIGH", created=-20, due=-2),
    task("Lectura", "COMPLETED", "MEDIUM", created=-30),
    task("Correo", "IN_PROGRESS", "LOW"),
]


def test_compute_metrics_counts_rates_and_weekly_activity():
    metrics = compute_metrics(SAMPLE, NOW)

    assert metrics.total == 4
    assert metrics.completed == 2
    assert metrics.completion_rate == 50.0
    assert metrics.high_priority.label == "Alta"
    assert metrics.high_priority.rate == 50.0
    assert metrics.overdue == 1
    assert metrics.week_created == 2
    assert metrics.week_completed == 2


def test_compute_metrics_without_tasks_is_zero():
    metrics = compute_metrics([], NOW)

    assert metrics.completion_rate == 0.0
    assert metrics.high_priority.rate == 0.0


def test_prompt_includes_the_high_priority_diagnosis_and_open_tasks():
    prompt = build_prompt(compute_metrics(SAMPLE, NOW), SAMPLE, NOW)

    assert "Completaste el 50.0% de tareas de prioridad Alta" in prompt
    assert "Entrega" in prompt
    assert "DIAGNÓSTICO:" in prompt and "RECOMENDACIONES:" in prompt


def test_sanitize_summary_removes_markdown_marks():
    assert sanitize_summary("## DIAGNÓSTICO\n**Bien** hecho\n\n1. Uno") == "DIAGNÓSTICO\nBien hecho\n1. Uno"


def test_seal_is_deterministic_and_signed_with_the_secret():
    payload = {"user_id": "u1", "summary": "Hola", "metrics": {"total": 1}}

    seal = make_seal(payload, "secreto")
    again = make_seal(payload, "secreto")
    expected_hash = hashlib.sha256(
        '{"metrics":{"total":1},"summary":"Hola","user_id":"u1"}'.encode("utf-8")
    ).hexdigest()

    assert seal == again
    assert seal.hash_hex == expected_hash
    assert seal.signature_hex == hmac.new(b"secreto", expected_hash.encode(), hashlib.sha256).hexdigest()


def test_render_report_pdf_returns_a_pdf_document():
    metrics = compute_metrics(SAMPLE, NOW)
    seal = make_seal({"user_id": "u1"}, "secreto")

    pdf = render_report_pdf(metrics, "DIAGNÓSTICO\nCompletaste el 50.0% de tareas de prioridad Alta.", NOW, seal)

    assert pdf.startswith(b"%PDF")
    assert pdf.rstrip().endswith(b"%%EOF")


@pytest.fixture
def auth_headers():
    token = create_access_token({"id": "user-1", "email": "ana@example.com"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def groq(monkeypatch):
    mock = AsyncMock(return_value="DIAGNÓSTICO\nBuen ritmo.\nRECOMENDACIONES:\n1. Planifica.")
    monkeypatch.setattr(productivity, "call_groq_with_retry", mock)
    return mock


def test_report_endpoint_requires_authentication(client):
    response = client.post("/api/ai/productivity-report")

    assert response.status_code == 401


def test_report_endpoint_returns_a_pdf_built_from_the_user_history(client, auth_headers, monkeypatch, groq):
    monkeypatch.setattr(productivity_report, "fetch_user_tasks", lambda token: SAMPLE)

    response = client.post("/api/ai/productivity-report", headers=auth_headers)

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    groq.assert_awaited_once()


def test_report_endpoint_skips_groq_when_there_is_no_history(client, auth_headers, monkeypatch, groq):
    monkeypatch.setattr(productivity_report, "fetch_user_tasks", lambda token: [])

    response = client.post("/api/ai/productivity-report", headers=auth_headers)

    assert response.status_code == 200
    groq.assert_not_awaited()


def test_report_endpoint_reports_task_service_failures(client, auth_headers, monkeypatch, groq):
    def unavailable(token: str):
        raise TaskHistoryError(503, "El servicio de tareas no está disponible.")

    monkeypatch.setattr(productivity_report, "fetch_user_tasks", unavailable)

    response = client.post("/api/ai/productivity-report", headers=auth_headers)

    assert response.status_code == 503
    assert response.json()["detail"] == "El servicio de tareas no está disponible."


def test_report_endpoint_maps_an_invalid_groq_key(client, auth_headers, monkeypatch, groq):
    monkeypatch.setattr(productivity_report, "fetch_user_tasks", lambda token: SAMPLE)
    groq.side_effect = Exception("API key not valid")

    response = client.post("/api/ai/productivity-report", headers=auth_headers)

    assert response.status_code == 400
