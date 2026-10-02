import Fastify, { FastifyRequest } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import { env } from './config/env';
import prisma from './lib/prisma';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import categoryRoutes from './routes/categories';
import taskRoutes from './routes/tasks';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(fastifyCors, {
    origin: process.env.NODE_ENV === 'production' ? env.CORS_ORIGIN?.split(',') ?? false : true,
  });
  await app.register(fastifyHelmet, { contentSecurityPolicy: false });
  await app.register(fastifyRateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(fastifySwagger, {
    openapi: {
      info: { title: 'TaskMate AI API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });

  await app.register(fastifyJwt, { secret: env.JWT_SECRET });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    await request.jwtVerify();
  });

  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Comprueba la disponibilidad del servicio y PostgreSQL',
        response: {
          200: { type: 'object', required: ['status', 'timestamp', 'database'], properties: { status: { type: 'string' }, timestamp: { type: 'string', format: 'date-time' }, database: { type: 'string' } } },
          503: { type: 'object', required: ['status', 'timestamp', 'database'], properties: { status: { type: 'string' }, timestamp: { type: 'string', format: 'date-time' }, database: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'ok', timestamp: new Date().toISOString(), database: 'connected' };
      } catch (err) {
        app.log.error({ err }, 'Healthcheck database connection failed');
        reply.status(503);
        return { status: 'error', timestamp: new Date().toISOString(), database: 'unavailable' };
      }
    },
  );

  app.get('/', async () => ({
    service: 'TaskMate AI backend',
    status: 'ok',
  }));

  app.get('/health/db', async (request, reply) => {
    try {
      // simple lightweight check
      await prisma.$queryRaw`SELECT 1`;
      return { db: 'ok' };
    } catch (err) {
      reply.status(500);
      return { db: 'error', error: String(err) };
    }
  });

  // register routes
  app.register(authRoutes);
  app.register(aiRoutes);
  app.register(categoryRoutes);
  app.register(taskRoutes);
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  return app;
}

const server = buildApp();

void server.then((app) => {
  app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }

    app.log.info(`Server listening on ${address}`);
  });
});
