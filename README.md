<!-- calidad:inicio -->
![Calidad](https://img.shields.io/badge/Calidad-12%2F100-red) ![Cumple](https://img.shields.io/badge/Cumple-10%2F15-yellow) ![Aprobado](https://img.shields.io/badge/Aprobado-NO-red)

**Calidad de servicios (heurístico):** índice **12/100** · cumple **10/15** · aprobado **NO** · capas **3**
`SEC 0 · SQL 0 · DBG 2 · duplicación 9.4% · vistas 18 · tests 0`
<!-- calidad:fin -->

# TaskMate AI

> Conventional Commit: `docs(spec): Modificar README.md con límites y arquitectura del sistema`

## Resumen Ejecutivo

TaskMate AI es un sistema de gestión de tareas orientado a productividad personal y equipos pequeños, diseñado para combinar una experiencia de usuario tradicional con una capa de lenguaje natural basada en Gemini API. La plataforma permite crear, consultar, actualizar y eliminar tareas mediante comandos en lenguaje natural, transformando texto libre en acciones CRUD sobre un modelo de datos centralizado.

La solución está concebida como un ecosistema modular con dos backends equivalentes (Node.js + Fastify y Python + FastAPI), dos frontends (React y Vue 3) y una capa de autenticación segura basada en email OTP sin contraseña. La integración con Gemini se utiliza exclusivamente para interpretar intenciones de usuario sobre tareas, reforzando la UX sin reemplazar el flujo manual ni la persistencia estructurada.

---

## Arquitectura General

```text
[React Web App]         [Vue 3 Web App]
        |                         |
        +----------- API Gateway / BFF -----------+
                        |
           +------------+------------+
           |                         |
   [Node.js / Fastify]      [Python / FastAPI]
           |                         |
           +----------- PostgreSQL -----------+
                   |
              Gemini API (NLU)
```

### Principios de diseño

- Persistencia única en PostgreSQL.
- Contratos de API equivalentes entre Node y Python con paridad del 100%.
- Autenticación por email OTP con flujo de dos pasos.
- Operaciones de tareas con CRUD manual y asistido por IA.
- Interacción conversacional orientada a tareas, sin ejecución de comandos del sistema operativo host.

---

## Límites del Sistema

### Dentro del alcance

| Categoría | Incluido |
| --- | --- |
| Persistencia | PostgreSQL como motor principal de datos |
| Backends | Dos implementaciones: Node.js con Fastify y Python con FastAPI |
| Frontends | Dos clientes: React y Vue 3 |
| Autenticación | Email OTP passwordless (flujo de dos pasos) |
| NLU | Interpretación de comandos sobre tareas usando Gemini API |
| Operaciones soportadas | CRUD de tareas y categorías, consultas conversacionales, inserción y edición asistida |

### Fuera del alcance

| Categoría | Excluido |
| --- | --- |
| OAuth social | Google, GitHub, Discord, Facebook, etc. |
| Ejecución de comandos del SO host | No se ejecutan procesos ni scripts del host |
| Multi-tenancy | No existe aislamiento por tenant ni organización |
| Notificaciones push | Sin push mobile/web ni notificaciones en tiempo real |

---

## Alcance Funcional

### Funcionalidades soportadas

| Área | Descripción |
| --- | --- |
| Auth OTP | Flujo de 2 pasos: solicitud del código por email y verificación del token OTP |
| Gestión manual | CRUD completo de tareas y categorías |
| Consulta conversacional | Búsqueda por lenguaje natural: “mostrar tareas pendientes”, “¿cuáles vencen hoy?” |
| Inserción asistida por IA | Generación de tareas a partir de texto libre |
| Modificación asistida por IA | Actualización de campos de tarea desde instrucciones naturales |
| Integridad de datos | Validación de payloads, estados permitidos y pertenencia de recursos al usuario |

### Alcance No Funcional

| Área | Meta / requisito |
| --- | --- |
| Dockerización | Entorno integrado totalmente dockerizado en menos de 2 minutos |
| Latencia REST | API REST < 150 ms en promedio, excluyendo llamadas a Gemini |
| Paridad de APIs | 100% de paridad en contratos entre backend Node y Python |
| Observabilidad | Logs estructurados, trazabilidad de errores y estados HTTP consistentes |
| Seguridad | Cifrado en tránsito, validación de sesiones y límites mínimos de autenticación |

---

## Matriz de Endpoints y Contratos de Datos esperados

### 1) Autenticación

| Método | Endpoint | Descripción | Request esperado | Response esperado |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/otp/request` | Solicita código OTP por email | `{ "email": "usuario@dominio.com" }` | `{ "success": true, "message": "OTP enviado" }` |
| POST | `/api/v1/auth/otp/verify` | Verifica código OTP | `{ "email": "usuario@dominio.com", "code": "123456" }` | `{ "token": "jwt", "user": { "id": "uuid", "email": "usuario@dominio.com" } }` |

### 2) Tareas

| Método | Endpoint | Descripción | Request esperado | Response esperado |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/tasks` | Listado de tareas | Query: `status`, `categoryId`, `priority`, `page`, `limit` | `{ "items": [...], "page": 1, "limit": 20, "total": 42 }` |
| GET | `/api/v1/tasks/:id` | Consulta una tarea | Ruta con `id` | `{ "id": "uuid", "title": "...", "status": "pending", ... }` |
| POST | `/api/v1/tasks` | Crear tarea | `{ "title": "Revisar diseño", "description": "...", "status": "pending", "priority": "high", "categoryId": "uuid", "dueDate": "2026-08-30T12:00:00Z" }` | `{ "id": "uuid", "createdAt": "...", "updatedAt": "..." }` |
| PATCH | `/api/v1/tasks/:id` | Actualizar tarea | `{ "title": "...", "status": "done", "priority": "medium" }` | `{ "id": "uuid", "updatedAt": "..." }` |
| DELETE | `/api/v1/tasks/:id` | Eliminar tarea | Ruta con `id` | `{ "success": true }` |

### 3) Categorías

| Método | Endpoint | Descripción | Request esperado | Response esperado |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/categories` | Listado de categorías | Sin body | `{ "items": [{ "id": "uuid", "name": "Trabajo" }] }` |
| GET | `/api/v1/categories/:id` | Consulta una categoría | Ruta con `id` | `{ "id": "uuid", "name": "Trabajo", "color": "#3B82F6" }` |
| POST | `/api/v1/categories` | Crear categoría | `{ "name": "Trabajo", "color": "#3B82F6" }` | `{ "id": "uuid", "createdAt": "..." }` |
| PATCH | `/api/v1/categories/:id` | Actualizar categoría | `{ "name": "Personal", "color": "#10B981" }` | `{ "id": "uuid", "updatedAt": "..." }` |
| DELETE | `/api/v1/categories/:id` | Eliminar categoría | Ruta con `id` | `{ "success": true }` |

### 4) Módulo NLU / Conversacional

| Método | Endpoint | Descripción | Request esperado | Response esperado |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/nlu/interpret` | Interpreta texto libre y devuelve intención estructurada | `{ "text": "Crear tarea: preparar demo de marketing para mañana", "context": { "activeCategoryId": "uuid" } }` | `{ "intent": "create_task", "confidence": 0.92, "entities": { "title": "preparar demo de marketing", "dueDate": "2026-08-27" }, "normalizedCommand": { "action": "create", "resource": "task" } }` |
| POST | `/api/v1/tasks/assistant` | Ejecuta acción sugerida por IA sobre tareas | `{ "instruction": "Actualiza la tarea de diseño a estado en progreso", "taskId": "uuid" }` | `{ "success": true, "task": { "id": "uuid", "status": "in_progress" } }` |

---

## Contratos de Datos Esperados

### Modelo de usuario

```json
{
  "id": "uuid",
  "email": "usuario@dominio.com",
  "createdAt": "2026-08-26T10:00:00Z",
  "updatedAt": "2026-08-26T10:00:00Z"
}
```

### Modelo de tarea

```json
{
  "id": "uuid",
  "userId": "uuid",
  "categoryId": "uuid",
  "title": "Revisar diseño de dashboard",
  "description": "Se requiere validar la versión final antes de la demo.",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-08-30T12:00:00Z",
  "createdAt": "2026-08-26T10:00:00Z",
  "updatedAt": "2026-08-26T10:05:00Z"
}
```

### Modelo de categoría

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Trabajo",
  "color": "#3B82F6",
  "createdAt": "2026-08-26T10:00:00Z",
  "updatedAt": "2026-08-26T10:00:00Z"
}
```

### Respuesta de NLU

```json
{
  "intent": "create_task",
  "confidence": 0.94,
  "entities": {
    "title": "Preparar demo de marketing",
    "dueDate": "2026-08-27",
    "priority": "medium"
  },
  "normalizedCommand": {
    "action": "create",
    "resource": "task",
    "status": "pending"
  }
}
```

### Reglas contractuales

- Los IDs deben ser UUID v4.
- Los valores de `status` deben cumplir un enum definido: `pending`, `in_progress`, `done`, `archived`.
- Los valores de `priority` deben ser: `low`, `medium`, `high`.
- Los endpoints de Node y Python deben exponer los mismos nombres, verbos y payloads.
- Las respuestas exitosas deben mantener un formato uniforme para todos los recursos.

---

## Criterios de Integración

- La capa de NLU solo interpreta intención y normaliza comando; no ejecuta procesos del host.
- Los frontends consumen los mismos contratos de API independientemente del backend elegido.
- La autenticación OTP y la sesión del usuario deben validarse en cada request protegida.
- La gestión de tareas se realiza sobre estructura relacional, con validación de categoría y usuario.

---

## Objetivo del Proyecto

TaskMate AI busca combinar velocidad operativa con experiencia conversacional para la gestión diaria de tareas, manteniendo un diseño limpio, portable y homogéneo entre tecnologías. Su foco está en ofrecer un flujo de trabajo intuitivo para creación, consulta y mantenimiento de tareas mediante lenguaje natural, sin perder la predictibilidad de un backend CRUD bien definido y compatible entre dos implementaciones paralelas.
