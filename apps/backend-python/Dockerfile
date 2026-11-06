# syntax=docker/dockerfile:1

# Etapa de build: las dependencias se instalan en un entorno virtual que luego se copia tal cual.
FROM python:3.11-slim AS build

WORKDIR /app

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
# pytest y httpx sólo sirven para las pruebas: no entran en la imagen.
RUN grep -viE '^(pytest|httpx)' requirements.txt > requirements.runtime.txt \
    && pip install -r requirements.runtime.txt

# Etapa final: intérprete, entorno virtual y código de la aplicación, sin herramientas de build.
FROM python:3.11-slim AS production

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000 \
    ENVIRONMENT=production

RUN useradd --system --uid 10001 --create-home app

COPY --from=build /opt/venv /opt/venv
COPY --chown=app:app app.py main.py ./
COPY --chown=app:app src ./src

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"

CMD ["python", "main.py"]
