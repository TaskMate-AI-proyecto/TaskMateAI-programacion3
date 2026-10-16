import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

export const testUser = { id: 'user-1', email: 'ana@example.com' };

export async function createTestApp() {
  const app = await buildApp({ logger: false });
  await app.ready();
  return app;
}

export function authHeaders(app: FastifyInstance, user = testUser) {
  return { authorization: `Bearer ${app.jwt.sign(user)}` };
}
