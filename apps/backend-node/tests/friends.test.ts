import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { authHeaders, createTestApp, testUser } from './helpers';

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  friendship: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

const bob = { id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' };
const dayMs = 24 * 60 * 60 * 1000;

describe('rutas de amigos', () => {
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

  it('caduca las solicitudes pendientes de más de 30 días antes de leer', async () => {
    prismaMock.friendship.findMany.mockResolvedValue([]);

    await app.inject({ method: 'GET', url: '/api/friends/requests', headers });

    const call = prismaMock.friendship.updateMany.mock.calls[0][0];
    expect(call.where.status).toBe('PENDING');
    expect(call.data).toEqual({ status: 'EXPIRED' });
    const cutoff = (call.where.createdAt as { lt: Date }).lt.getTime();
    expect(Date.now() - cutoff).toBeGreaterThanOrEqual(30 * dayMs - 1000);
    expect(Date.now() - cutoff).toBeLessThanOrEqual(30 * dayMs + 1000);
  });

  it('GET /api/friends lista sólo amistades aceptadas con nivel y racha del amigo', async () => {
    const progress = { level: 3, currentStreak: 2, lastTaskCompletedAt: new Date() };
    prismaMock.friendship.findMany.mockResolvedValue([
      {
        id: 'f1',
        senderId: 'user-1',
        receiverId: 'user-2',
        updatedAt: new Date(),
        sender: { ...testUser, uniqueTag: '@ana_8f9a2c', ...progress },
        receiver: { ...bob, ...progress },
      },
    ]);

    const response = await app.inject({ method: 'GET', url: '/api/friends', headers });

    expect(prismaMock.friendship.findMany.mock.calls[0][0].where.status).toBe('ACCEPTED');
    expect(response.json()).toEqual([
      expect.objectContaining({
        friendshipId: 'f1',
        friend: { ...bob, level: 3, currentStreak: 2 },
      }),
    ]);
  });

  it('GET /api/friends/requests devuelve las activas con los días que quedan', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * dayMs);
    prismaMock.friendship.findMany.mockResolvedValue([
      {
        id: 'f2',
        senderId: 'user-2',
        receiverId: 'user-1',
        createdAt: tenDaysAgo,
        sender: bob,
        receiver: testUser,
      },
    ]);

    const response = await app.inject({ method: 'GET', url: '/api/friends/requests', headers });

    expect(response.json()).toEqual([
      expect.objectContaining({ id: 'f2', direction: 'incoming', user: bob, daysLeft: 20 }),
    ]);
  });

  it('POST /api/friends/request responde 404 si el identificador no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      headers,
      payload: { uniqueTag: '@nadie_000000' },
    });

    expect(response.statusCode).toBe(404);
    expect(prismaMock.friendship.create).not.toHaveBeenCalled();
  });

  it('POST /api/friends/request no permite agregarse a uno mismo', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...testUser, uniqueTag: '@ana_000001' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      headers,
      payload: { uniqueTag: '@ana_000001' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('POST /api/friends/request bloquea si ya son amigos o hay una solicitud pendiente', async () => {
    prismaMock.user.findUnique.mockResolvedValue(bob);

    prismaMock.friendship.findFirst.mockResolvedValueOnce({
      id: 'f1',
      senderId: 'user-1',
      receiverId: 'user-2',
      status: 'ACCEPTED',
    });
    const accepted = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      headers,
      payload: { uniqueTag: bob.uniqueTag },
    });

    prismaMock.friendship.findFirst.mockResolvedValueOnce({
      id: 'f2',
      senderId: 'user-2',
      receiverId: 'user-1',
      status: 'PENDING',
    });
    const incoming = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      headers,
      payload: { uniqueTag: bob.uniqueTag },
    });

    expect(accepted.statusCode).toBe(409);
    expect(incoming.statusCode).toBe(409);
    expect(incoming.json().message).toContain('Acéptala');
    expect(prismaMock.friendship.create).not.toHaveBeenCalled();
  });

  it('POST /api/friends/request reutiliza una solicitud rechazada o caducada', async () => {
    prismaMock.user.findUnique.mockResolvedValue(bob);
    prismaMock.friendship.findFirst.mockResolvedValue({
      id: 'f3',
      senderId: 'user-1',
      receiverId: 'user-2',
      status: 'REJECTED',
    });
    prismaMock.friendship.update.mockResolvedValue({ id: 'f3', status: 'PENDING' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      headers,
      payload: { uniqueTag: bob.uniqueTag },
    });

    expect(response.statusCode).toBe(201);
    expect(prismaMock.friendship.update).toHaveBeenCalledWith({
      where: { id: 'f3' },
      data: expect.objectContaining({
        senderId: 'user-1',
        receiverId: 'user-2',
        status: 'PENDING',
      }),
    });
  });

  it('POST /api/friends/request crea una solicitud nueva', async () => {
    prismaMock.user.findUnique.mockResolvedValue(bob);
    prismaMock.friendship.findFirst.mockResolvedValue(null);
    prismaMock.friendship.create.mockResolvedValue({ id: 'f4', status: 'PENDING' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      headers,
      payload: { uniqueTag: bob.uniqueTag },
    });

    expect(response.statusCode).toBe(201);
    expect(prismaMock.friendship.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        senderId: 'user-1',
        receiverId: 'user-2',
        status: 'PENDING',
      }),
    });
  });

  it('POST /api/friends/respond acepta una solicitud recibida', async () => {
    prismaMock.friendship.findUnique.mockResolvedValue({
      id: 'f2',
      senderId: 'user-2',
      receiverId: 'user-1',
      status: 'PENDING',
    });
    prismaMock.friendship.update.mockResolvedValue({ id: 'f2', status: 'ACCEPTED' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/friends/respond',
      headers,
      payload: { requestId: 'f2', action: 'accept' },
    });

    expect(response.json()).toEqual({ id: 'f2', status: 'ACCEPTED' });
    expect(prismaMock.friendship.update).toHaveBeenCalledWith({
      where: { id: 'f2' },
      data: { status: 'ACCEPTED' },
    });
  });

  it('POST /api/friends/respond rechaza solicitudes ajenas, caducadas o ya respondidas', async () => {
    prismaMock.friendship.findUnique.mockResolvedValueOnce({
      id: 'f5',
      senderId: 'user-1',
      receiverId: 'user-9',
      status: 'PENDING',
    });
    const notMine = await app.inject({
      method: 'POST',
      url: '/api/friends/respond',
      headers,
      payload: { requestId: 'f5', action: 'accept' },
    });

    prismaMock.friendship.findUnique.mockResolvedValueOnce({
      id: 'f6',
      senderId: 'user-2',
      receiverId: 'user-1',
      status: 'EXPIRED',
    });
    const expired = await app.inject({
      method: 'POST',
      url: '/api/friends/respond',
      headers,
      payload: { requestId: 'f6', action: 'accept' },
    });

    prismaMock.friendship.findUnique.mockResolvedValueOnce({
      id: 'f7',
      senderId: 'user-2',
      receiverId: 'user-1',
      status: 'ACCEPTED',
    });
    const answered = await app.inject({
      method: 'POST',
      url: '/api/friends/respond',
      headers,
      payload: { requestId: 'f7', action: 'reject' },
    });

    expect(notMine.statusCode).toBe(404);
    expect(expired.statusCode).toBe(410);
    expect(answered.statusCode).toBe(409);
    expect(prismaMock.friendship.update).not.toHaveBeenCalled();
  });
});
