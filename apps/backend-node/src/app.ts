import Fastify, { FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';

import { env } from './config/env';
import prisma from './lib/prisma';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(fastifyJwt, { secret: env.JWT_SECRET });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    await request.jwtVerify();
  });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

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
  app.register(categoryRoutes);

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
