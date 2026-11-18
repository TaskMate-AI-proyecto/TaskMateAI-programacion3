"""Llamada HTTP a Groq: petición, cabeceras y traducción de errores."""

import httpx
import pytest

from src.services import groq
from src.services.groq import GroqError, _request_completion


async def test_sends_the_prompt_to_groq_chat_completions(monkeypatch):
    captured: dict = {}

    async def fake_post(self, url, headers=None, json=None, **kwargs):
        captured.update(url=url, headers=headers, json=json)
        return httpx.Response(200, json={"choices": [{"message": {"content": "hola"}}]})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    monkeypatch.setattr(groq.settings, "groq_api_key", "clave-prueba")

    assert await _request_completion("pregunta") == "hola"
    assert captured["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert captured["headers"] == {"Authorization": "Bearer clave-prueba"}
    assert captured["json"]["messages"] == [{"role": "user", "content": "pregunta"}]


async def test_http_error_keeps_the_status_for_retry_and_mapping(monkeypatch):
    async def fake_post(self, url, **kwargs):
        return httpx.Response(429, json={"error": {"message": "rate limit"}})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    with pytest.raises(GroqError) as info:
        await _request_completion("pregunta")

    assert info.value.status_code == 429


async def test_connection_failures_are_reported_as_unavailable(monkeypatch):
    async def fake_post(self, url, **kwargs):
        raise httpx.ConnectError("sin conexión")

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    with pytest.raises(GroqError) as info:
        await _request_completion("pregunta")

    assert info.value.status_code == 503


async def test_unexpected_payload_is_reported(monkeypatch):
    async def fake_post(self, url, **kwargs):
        return httpx.Response(200, json={"sin": "opciones"})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    with pytest.raises(GroqError) as info:
        await _request_completion("pregunta")

    assert info.value.status_code == 500


async def test_system_instruction_is_sent_before_the_user_prompt(monkeypatch):
    captured: dict = {}

    async def fake_post(self, url, headers=None, json=None, **kwargs):
        captured.update(json=json)
        return httpx.Response(200, json={"choices": [{"message": {"content": "ok"}}]})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    await _request_completion("pregunta", system="formato")

    assert captured["json"]["messages"] == [
        {"role": "system", "content": "formato"},
        {"role": "user", "content": "pregunta"},
    ]
