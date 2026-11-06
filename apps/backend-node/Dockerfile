# syntax=docker/dockerfile:1

# Etapa de dependencias de producción: sin devDependencies ni peers (Prisma CLI, TypeScript, ESLint, Vitest).
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --omit=peer

# Etapa de build: dependencias completas para generar el cliente de Prisma y compilar TypeScript.
# El nombre `build` lo usa el servicio `migrate` de docker-compose.yml.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src

RUN npm run prisma:generate && npm run build

# Etapa final: dependencias de producción, cliente de Prisma generado y código compilado.
# El nombre `production` lo usa el servicio `backend` de docker-compose.yml.
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "dist/app.js"]
