# TaskMate AI Backend - Python FastAPI Implementation

A Python FastAPI backend for TaskMate AI, providing AI-powered task management with Google Gemini integration.

## Features

- **FastAPI** for high-performance async API
- **SQLAlchemy** ORM with PostgreSQL
- **Google Gemini** integration for AI-powered chat and task generation
- **JWT** authentication
- **Pydantic** validation and serialization
- **AI Chat with Command Parsing** - Chat endpoint that automatically creates and manages tasks
- **100% Type-Safe** - No `Any` types, full type hints
- **Comprehensive Tests** - Unit and integration tests with pytest

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL 12+
- Google Gemini API key

### Installation

1. **Create virtual environment:**

```bash
cd apps/backend-python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database:**

```bash
python -c "from src.services.database import init_db; init_db()"
```

5. **Run server:**

```bash
python main.py
```

The API will be available at `http://localhost:8000`.

## Development

### Running Tests

```bash
pytest
```

With coverage:

```bash
pytest --cov=src --cov-report=html
```

### Code Quality

Format code:
```bash
black src tests
isort src tests
```

Type checking:
```bash
mypy src
```

Linting:
```bash
ruff check src tests
```

## API Endpoints

### Health

- `GET /` - Root endpoint
- `GET /health` - Health check

### AI

- `POST /api/ai/chat` - Chat with AI and automatic task management
  - Input: `{"message": "string"}`
  - Response: `{"success": true, "message": "string", "created_tasks": [...], "commands_executed": [...]}`

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/verify-email` - Verify email with code

### Tasks

- `GET /api/tasks` - List user's tasks
- `GET /api/tasks/{id}` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Categories

- `GET /api/categories` - List user's categories
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

## Architecture

```
src/
├── config/          # Configuration (Pydantic settings)
├── models/          # SQLAlchemy ORM models
├── schemas/         # Pydantic request/response schemas
├── services/        # Business logic (Gemini, DB)
├── routes/          # API route handlers
└── utils/           # Utilities (JWT, errors)

tests/               # Pytest tests
├── conftest.py      # Shared fixtures
├── test_gemini_service.py
└── test_ai_chat_endpoint.py
```

## Key Features

### AI Chat with Command Parsing

The `/api/ai/chat` endpoint supports intelligent task management through AI:

```json
POST /api/ai/chat
{
  "message": "Create a task to learn Python by Friday"
}

Response:
{
  "success": true,
  "message": "I'll create that task for you. Your task has been created for Friday.",
  "commands_executed": ["CREATE_TASK"],
  "created_tasks": ["task-id-1"],
  "updated_tasks": [],
  "deleted_tasks": []
}
```

The AI can parse embedded commands and automatically:
- Create new tasks
- Update existing tasks  
- Delete tasks
- Set priorities and due dates

### Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message in Spanish"
}
```

Status codes map Gemini errors intelligently:
- 401/403 API key errors → 400 (invalid key)
- 429 rate limit → 429 (quota exceeded)
- 503 service unavailable → 503
- Other errors → 500

## Environment Variables

See `.env.example` for all configuration options.

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `GEMINI_API_KEY` - Google Gemini API key

## Docker

Build and run with Docker:

```bash
docker build -t taskmate-backend-python .
docker run -p 8000:3000 --env-file .env taskmate-backend-python
```

Or with Docker Compose:

```bash
docker-compose up backend-python
```

## Issue 17: Implementation

This backend implements Issue 17 requirements:

✅ POST /api/ai/chat endpoint
✅ Google Gemini API integration
✅ Command parsing and task creation
✅ Strong typing (no Any)
✅ Early returns and helper functions
✅ Comprehensive unit and integration tests
✅ Updated .gitignore with required exclusions
✅ 100% test success

## License

MIT
