# Backend PR Checklist

- [x] TypeScript compila con `npm run build`.
- [x] Prisma Client se genera antes de compilar y está disponible en runtime.
- [x] `GET /health` valida PostgreSQL y responde con estado de conexión.
- [x] Swagger UI está disponible en `/docs`.
- [x] El contrato exportable está en `docs/openapi.json` y se regenera con `npm run openapi:export`.
- [x] CORS acepta el origen definido por `FRONTEND_URL`.
- [x] `.env` y sus variantes están ignorados; `.env.example` documenta las variables necesarias.
- [x] El Dockerfile compila el backend y crea una imagen con dependencias de producción.
- [x] Docker Compose ejecuta migraciones antes de iniciar el backend.
- [x] El backend publicado por Compose queda disponible en el puerto `3001`.

## Antes de fusionar

- [ ] Configurar secretos reales de producción para `JWT_SECRET`, `GEMINI_API_KEY` y SMTP.
- [ ] Configurar `FRONTEND_URL` con el dominio del cliente desplegado.
- [ ] Ejecutar `docker compose up --build` en el entorno de destino.