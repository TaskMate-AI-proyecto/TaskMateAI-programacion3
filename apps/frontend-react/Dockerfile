# syntax=docker/dockerfile:1

# Etapa de build: compila la SPA con Vite. Las variables VITE_* quedan incrustadas en el bundle.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL del API que usará el navegador. Se fija al construir la imagen: cambiarla exige reconstruirla.
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Etapa final: nginx sin privilegios sirve los archivos estáticos y resuelve las rutas de la SPA.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
