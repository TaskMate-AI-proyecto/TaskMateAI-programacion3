import Fastify from 'fastify';

import { env } from './config/env';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  app.get('/', async () => ({
    service: 'TaskMate AI backend',
    status: 'ok',
  }));

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
