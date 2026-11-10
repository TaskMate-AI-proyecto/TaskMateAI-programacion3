# TaskMate AI: documentación del proyecto

Guía operativa de la solución: arquitectura final, puertos, variables de entorno, ejecución e historial de verificación.
La especificación funcional y los contratos de datos están en [README.md](README.md).

## 1. Arquitectura final

```
                    navegador
          ┌───────────────┴───────────────┐
          ▼                               ▼
 frontend-react :5173           frontend-vue :5174
 (Vite build → nginx)           (Vite build → nginx)
          │                               │
          └──────────────┬────────────────┘
                         ▼  VITE_API_BASE_URL (fijado al construir)
                 backend :3001 (Node 22 · Fastify · Prisma)
                         │
                         ▼
                 db :5433 (Postgres 16) ── base taskmate_db
                         ▲
                 backend-python :8000 (FastAPI · SQLAlchemy)
                         └── base taskmate_python
```

Servicios de `docker-compose.yml`:

| Servicio | Imagen / build | Puerto host → contenedor | Healthcheck | Arranque |
|---|---|---|---|---|
| `db` | `postgres:16-alpine` | 5433 → 5432 | `pg_isready` | — |
| `db-init` | `postgres:16-alpine` | — | one-shot, crea `taskmate_python` si falta | tras `db` sano |
| `migrate` | `apps/backend-node` (etapa `build`) | — | one-shot, `prisma migrate deploy` | tras `db` sano |
| `backend` | `apps/backend-node` (etapa `production`) | 3001 → 3000 | `GET /health` | tras `migrate` (código 0) |
| `backend-python` | `apps/backend-python` | 8000 → 8000 | `GET /health` | tras `db-init` (código 0) |
| `frontend-react` | `apps/frontend-react` (nginx sin privilegios) | 5173 → 8080 | `GET /` | tras `backend` sano |
| `frontend-vue` | `apps/frontend-vue` (nginx sin privilegios) | 5174 → 8080 | `GET /` | tras `backend` sano |

Notas de diseño:

- **Dos bases en el mismo Postgres.** El backend Node usa Prisma sobre `taskmate_db`; el backend Python usa SQLAlchemy sobre `taskmate_python`. Así no comparten tablas ni migraciones.
- **Frontends y API.** La URL del API se incrusta en el bundle al construir la imagen (`VITE_API_BASE_URL`, por defecto `http://localhost:3001`). Si cambia, hay que reconstruir los frontends.
- **CORS.** Ambos backends aceptan los orígenes de `FRONTEND_URL` (lista separada por comas).
- **Estado del backend Python en esta rama.** Expone `/health`, `/` y `POST /api/ai/chat` (que requiere JWT y Gemini). No tiene aún rutas de autenticación ni CRUD de tareas: los frontends solo consumen Node.

## 2. Puertos de acceso

| Qué | URL |
|---|---|
| App React | http://localhost:5173 |
| App Vue | http://localhost:5174 |
| API Node (Swagger en `/docs`) | http://localhost:3001 |
| API Python | http://localhost:8000 |
| Postgres (cliente externo) | `localhost:5433` |

## 3. Variables de entorno

Archivo `.env` en la raíz (plantilla: `.env.example`). Docker Compose lo lee automáticamente.

| Variable | Obligatoria | Uso |
|---|---|---|
| `JWT_SECRET` | sí | Firma de los JWT. Node y Python la comparten. |
| `GEMINI_API_KEY` | sí | Clave de Gemini para el módulo de IA. |
| `POSTGRES_USER` | no (`postgres`) | Usuario de Postgres y de las conexiones. |
| `POSTGRES_PASSWORD` | no (`postgres`) | Contraseña de Postgres. |
| `POSTGRES_DB` | no (`taskmate_db`) | Base del backend Node. |
| `FRONTEND_URL` | no (`http://localhost:5173,http://localhost:5174`) | Orígenes permitidos por CORS. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | no | Envío de códigos de acceso por correo. Sin `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS`, el envío falla con 500. |

Variables que Compose fija por servicio (no hay que definirlas en `.env`): `DATABASE_URL`, `PORT`, `ENVIRONMENT` del backend Python (`production`).
Build args de los frontends: `VITE_API_BASE_URL`.

Sin `.env`, Compose no arranca: `JWT_SECRET` y `GEMINI_API_KEY` usan `${VAR:?...}`.

## 4. Ejecución

Hay dos formas de ejecutar el sistema. **No las mezcles**: ambas usan los mismos puertos (3001, 8000, 5173, 5174), y la base de datos (5433) es compartida.

### 4.1 Con Docker (recomendado): una sola terminal

Requisitos: Docker Engine con Docker Compose v2 y el archivo `.env` en la raíz (plantilla: `.env.example`).

```bash
docker compose up -d --build --wait
```

- Corre **todo en segundo plano** desde una sola terminal: la base, los dos backends y los dos frontends.
- `--build` reconstruye las imágenes que cambiaron.
- `--wait` espera a que los healthchecks pasen. Sin ella, el comando retorna antes de que los servicios estén sanos.
- Sin `-d`, `docker compose up --build` queda en primer plano mostrando logs de todos los servicios y no espera los healthchecks.

Comprobar el estado:

```bash
docker compose ps
curl http://localhost:3001/health   # {"status":"ok",...,"database":"connected"}
curl http://localhost:8000/health   # {"status":"ok"}
```

Ver logs de un servicio concreto (`Ctrl+C` solo deja de mostrarlos; el servicio sigue corriendo):

```bash
docker compose logs -f backend
docker compose logs -f backend-python
docker compose logs -f frontend-react
docker compose logs -f frontend-vue
docker compose logs -f db
```

Servicios disponibles: `db`, `db-init`, `migrate`, `backend`, `backend-python`, `frontend-react`, `frontend-vue`.

Reconstruir y reiniciar un solo servicio, por ejemplo tras cambiar código:

```bash
docker compose up -d --build backend
```

Detener:

```bash
docker compose down        # detiene y quita los contenedores; conserva los datos
docker compose down -v     # además borra el volumen de Postgres (pierde datos)
```

### 4.2 Ejecución local en desarrollo: una terminal por servicio

Usa esta forma para editar código con recarga en caliente. Cada servicio corre en su propia terminal y todas deben quedar abiertas.

**Antes de empezar:** detén los servicios de aplicación del stack Docker para liberar los puertos. La base puede seguir activa:

```bash
docker compose stop backend backend-python frontend-react frontend-vue
```

Requisitos: Node 22, Python 3.11 con el entorno `apps/backend-python/venv` creado e instalado desde `requirements.txt`, y `npm install` ejecutado en `apps/backend-node`, `apps/frontend-react` y `apps/frontend-vue`.

| Terminal | Servicio | Comando (ejecutar desde la raíz del repositorio) | Puerto |
|---|---|---|---|
| 1 | Base de datos Postgres | `docker compose up db` | 5433 |
| 2 | Backend Node | `cd apps/backend-node && PORT=3001 DATABASE_URL=postgresql://postgres:postgres@localhost:5433/taskmate_db npm run dev` | 3001 |
| 3 | Backend Python | `cd apps/backend-python && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/taskmate_python FRONTEND_URL=http://localhost:5173,http://localhost:5174 venv/bin/uvicorn app:app --reload --port 8000` | 8000 |
| 4 | Frontend React | `cd apps/frontend-react && npm run dev` | 5173 |
| 5 | Frontend Vue | `cd apps/frontend-vue && npm run dev` | 5174 |

Orden recomendado: terminal 1 primero (la base debe estar sana), luego 2 y 3, y por último 4 y 5.

Aclaraciones importantes:

- **Terminal 1 es primer plano.** `docker compose up db` muestra los logs de Postgres y mantiene la terminal ocupada. Si pulsas `Ctrl+C`, **se detiene la base de datos**, y los backends pierden la conexión. Si prefieres no ocupar una terminal, usa `docker compose up -d db`.
- **Variables en la misma línea.** Las variables `PORT`, `DATABASE_URL` y `FRONTEND_URL` se pasan en el comando porque los `.env` locales no las traen con estos valores: `apps/backend-node/.env` no define `DATABASE_URL` ni `PORT` (sin `PORT` Node escucha en 3000), y `apps/backend-python/.env` apunta a SQLite (`sqlite:///./test.db`) y no define `FRONTEND_URL`. Si prefieres, puedes poner esas variables en los `.env` locales en lugar de la línea de comando.
- **Puerto de React.** Vite usa 5173 por defecto y, si está ocupado, elige otro puerto. El de Vue sí es estricto (`strictPort`): si 5174 está ocupado, Vue falla en lugar de cambiar. Revisa en la salida de la terminal 4 que diga `http://localhost:5173/`.
- **Python con recarga.** `--reload` reinicia el servidor al guardar cambios. Usa `app:app` (módulo `app.py`, variable `app`), no `app.app`.

Comprobar que todo responde:

```bash
curl http://localhost:3001/health   # Node, con base conectada
curl http://localhost:8000/health   # Python
curl -I http://localhost:5173/      # React
curl -I http://localhost:5174/      # Vue
```

Detener: `Ctrl+C` en cada terminal. Después, si la base de la terminal 1 sigue en marcha, bájala con `docker compose down` (conserva datos).

### 4.3 Qué hacer con cada opción

| Necesito | Usa |
|---|---|
| Probar el sistema completo o entregar | 4.1 (Docker) |
| Desarrollar y ver cambios al instante | 4.2 (local) |

## 5. Historial de verificación

Fecha de las pruebas: 2026-11-06. Salvo la fila de ejecución local, todas se ejecutaron sobre el stack levantado con `docker compose`.

| Verificación | Resultado |
|---|---|
| Ciclo completo: `docker compose down` y luego `docker compose up -d --build --wait` | Código 0. Los 5 servicios de larga duración quedan `healthy`. `db-init` y `migrate` terminan con código 0. |
| Idempotencia de `db-init` (base inexistente y luego existente, en un Postgres de prueba) | Primera ejecución: `CREATE DATABASE`. Segunda: no hace nada, código 0. |
| `GET /health` en `:3001` | 200, `{"status":"ok","database":"connected"}` |
| `GET /health` en `:8000` | 200, `{"status":"ok"}` |
| `GET /` en `:5173` y `:5174` | 200, HTML de la SPA. Las rutas `/dashboard` y `/chat` también responden 200 (fallback de nginx). |
| CORS (preflight `OPTIONS`) en `:3001` y `:8000` | Devuelve `Access-Control-Allow-Origin` para `http://localhost:5173` y `http://localhost:5174`. Un origen ajeno (`http://evil.example`) no recibe el encabezado. |
| Persistencia Node | Tarea creada por API, contenedor `backend` reiniciado, la tarea sigue presente por API y en `taskmate_db`. |
| Persistencia Python | Las 4 tablas (`user`, `task`, `category`, `verification_code`) están en `taskmate_python` y siguen tras reiniciar el contenedor. |
| Conectividad React → Node y Python (navegador real, Firefox vía Playwright) | Carga de tareas 200. Creación desde la UI 201 con CORS en el POST. Fila visible en `taskmate_db`. `fetch` desde el origen `:5173` a `:3001/health` y `:8000/health` devuelve el JSON. Sin errores de consola. |
| Conectividad Vue → Node y Python (navegador real) | Igual que React: 200, 201, CORS correcto, fila en `taskmate_db`, `fetch` cross-origin correcto y sin errores de consola. |
| Ejecución local (sección 4.2): Node con `PORT=3001`, Python con `DATABASE_URL` a `taskmate_python`, React y Vue con `npm run dev` | Node responde 200 con base conectada; Python arranca con `startup complete`; React en `:5173` y Vue en `:5174` responden 200. El CORS de `:3001` y `:8000` acepta ambos orígenes locales. Sin errores en los logs de arranque. |
| Tests del backend Python (`pytest`) | 57 pasan. Cobertura 99 %. |
| Tests del frontend Vue (`vitest`) y lint | 97 pasan (17 archivos). Lint sin errores. Build con `vue-tsc` correcto. |

Datos de prueba: las tareas y el usuario de verificación se eliminaron tras cada prueba. Las pruebas no llamaron a Gemini ni enviaron correos.

## 6. Límites conocidos

- **Chat con IA sin prueba de extremo a extremo.** La ruta `POST /api/ai/chat` está comprobada en su autenticación, pero no se ejecutó con Gemini real para no consumir cuota.
- **Envío de códigos.** Requiere SMTP configurado. Sin él, el flujo de acceso por correo no puede completarse; la verificación de la base se hizo insertando el código directamente.
- **Rutas de autenticación.** El README define `/api/v1/auth/otp/request` y `/api/v1/auth/otp/verify`. El backend Node implementa y los frontends usan `POST /api/auth/send-code` y `POST /api/auth/verify-code`. Son las rutas vigentes en esta versión; el README debe actualizarse.
- **Python sin CRUD de tareas.** Ver la sección 1. Los frontends no lo usan en esta rama.
- **Imagen de Node pesada (≈556 MB).** `@prisma/client` 7.x trae como dependencias el CLI de Prisma y TypeScript. Reducirla exige cambiar de versión de Prisma.
