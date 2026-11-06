import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestApp } from './helpers';

const prismaMock = vi.hoisted(() => ({ $queryRaw: vi.fn() }));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

describe('aplicación Fastify', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('expone la identificación del servicio en la raíz', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ service: 'TaskMate AI backend', status: 'ok' });
  });

  it('el healthcheck confirma la conexión a la base', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', database: 'connected' });
  });

  it('el healthcheck responde 503 cuando la base no responde', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('sin conexión'));

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'error', database: 'unavailable' });
  });

  it('el chequeo de base responde ok o 500 según la consulta', async () => {
    const ok = await app.inject({ method: 'GET', url: '/health/db' });
    expect(ok.json()).toEqual({ db: 'ok' });

    prismaMock.$queryRaw.mockRejectedValue(new Error('caída'));

    const failed = await app.inject({ method: 'GET', url: '/health/db' });
    expect(failed.statusCode).toBe(500);
    expect(failed.json().db).toBe('error');
  });

  it('permite el origen del frontend con los métodos que usa la API', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/tasks',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'PUT',
      },
    });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-methods']).toContain('PUT');
  });

  it('permite también el origen del frontend Vue (5174)', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/send-code',
      headers: { origin: 'http://localhost:5174', 'access-control-request-method': 'POST' },
    });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5174');
  });

  it('publica la especificación OpenAPI con el esquema bearer', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(response.statusCode).toBe(200);
    const spec = response.json();
    expect(spec.info.title).toBe('TaskMate AI API');
    expect(spec.components.securitySchemes.bearerAuth).toMatchObject({ scheme: 'bearer' });
  });
});
