import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { authHeaders, createTestApp, testUser } from './helpers';

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findMany: vi.fn() },
  friendship: { findMany: vi.fn(), updateMany: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

describe('rutas de usuarios', () => {
  let app: FastifyInstance;
  let headers: ReturnType<typeof authHeaders>;

  beforeAll(async () => {
    app = await createTestApp();
    headers = authHeaders(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.friendship.updateMany.mockResolvedValue({ count: 0 });
  });

  it('GET /api/users/me devuelve mi identificador público', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: testUser.email,
      uniqueTag: '@ana_000001',
    });

    const response = await app.inject({ method: 'GET', url: '/api/users/me', headers });

    expect(response.json()).toEqual({
      id: 'user-1',
      email: testUser.email,
      uniqueTag: '@ana_000001',
    });
  });

  it('GET /api/users/search exige al menos 2 caracteres', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/users/search?tag=a', headers });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it('GET /api/users/search busca por coincidencia parcial sin devolver correos y marca la relación', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: 'user-2', uniqueTag: '@bob_123abc' },
      { id: 'user-3', uniqueTag: '@bobby_9' },
    ]);
    prismaMock.friendship.findMany.mockResolvedValue([
      { senderId: 'user-1', receiverId: 'user-2', status: 'PENDING' },
    ]);

    const response = await app.inject({ method: 'GET', url: '/api/users/search?tag=bob', headers });

    const where = prismaMock.user.findMany.mock.calls[0][0];
    expect(where.where.uniqueTag).toEqual({ contains: 'bob', mode: 'insensitive' });
    expect(where.where.id).toEqual({ not: testUser.id });
    expect(where.select).not.toHaveProperty('email');
    expect(response.json()).toEqual([
      { id: 'user-2', uniqueTag: '@bob_123abc', relation: 'outgoing' },
      { id: 'user-3', uniqueTag: '@bobby_9', relation: 'none' },
    ]);
  });
});
