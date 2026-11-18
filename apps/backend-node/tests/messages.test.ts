import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { authHeaders, createTestApp, testUser } from './helpers';

const prismaMock = vi.hoisted(() => ({
  user: { findMany: vi.fn(), findUnique: vi.fn() },
  friendship: { findMany: vi.fn(), findFirst: vi.fn() },
  message: { groupBy: vi.fn(), findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

const bob = { id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' };
const sentAt = new Date('2026-11-10T10:00:00.000Z');
const laterAt = new Date('2026-11-10T11:00:00.000Z');
const acceptedWithBob = { senderId: 'user-1', receiverId: 'user-2', status: 'ACCEPTED' };

describe('rutas de mensajes', () => {
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
  });

  it('GET /api/messages/contacts exige sesión', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/messages/contacts' });

    expect(response.statusCode).toBe(401);
  });

  it('GET /api/messages/contacts sólo lista amigos con no leídos y el último mensaje', async () => {
    prismaMock.friendship.findMany.mockResolvedValue([acceptedWithBob]);
    prismaMock.user.findMany.mockResolvedValue([bob]);
    prismaMock.message.groupBy.mockResolvedValue([{ senderId: 'user-2', _count: { _all: 3 } }]);
    prismaMock.message.findMany.mockResolvedValue([
      { senderId: 'user-1', receiverId: 'user-2', content: 'Nos vemos mañana', createdAt: laterAt },
      { senderId: 'user-2', receiverId: 'user-1', content: 'Hola', createdAt: sentAt },
    ]);

    const response = await app.inject({ method: 'GET', url: '/api/messages/contacts', headers });

    expect(response.statusCode).toBe(200);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['user-2'] } } }),
    );
    expect(response.json()).toEqual([
      {
        id: 'user-2',
        email: 'bob@example.com',
        uniqueTag: '@bob_123abc',
        unreadCount: 3,
        lastMessage: {
          content: 'Nos vemos mañana',
          createdAt: laterAt.toISOString(),
          fromMe: true,
        },
      },
    ]);
  });

  it('GET /api/messages/:userId devuelve la conversación en orden cronológico entre amigos', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.friendship.findFirst.mockResolvedValue({ status: 'ACCEPTED' });
    prismaMock.message.findMany.mockResolvedValue([
      { id: 'm2', content: 'Segundo', createdAt: laterAt },
      { id: 'm1', content: 'Primero', createdAt: sentAt },
    ]);

    const response = await app.inject({ method: 'GET', url: '/api/messages/user-2', headers });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((message: { id: string }) => message.id)).toEqual(['m1', 'm2']);
  });

  it('GET /api/messages/:userId responde 404 si el usuario no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await app.inject({ method: 'GET', url: '/api/messages/nadie', headers });

    expect(response.statusCode).toBe(404);
  });

  it('GET /api/messages/:userId rechaza conversaciones con quien no es amigo', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.friendship.findFirst.mockResolvedValue({ status: 'PENDING' });

    const response = await app.inject({ method: 'GET', url: '/api/messages/user-2', headers });

    expect(response.statusCode).toBe(403);
    expect(prismaMock.message.findMany).not.toHaveBeenCalled();
  });

  it('POST /api/messages guarda el mensaje entre amigos', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.friendship.findFirst.mockResolvedValue({ status: 'ACCEPTED' });
    prismaMock.message.create.mockResolvedValue({
      id: 'm1',
      senderId: 'user-1',
      receiverId: 'user-2',
      content: 'Hola',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/messages',
      headers,
      payload: { receiverId: 'user-2', content: '  Hola  ' },
    });

    expect(response.statusCode).toBe(201);
    expect(prismaMock.message.create).toHaveBeenCalledWith({
      data: { senderId: 'user-1', receiverId: 'user-2', content: 'Hola' },
    });
  });

  it('POST /api/messages rechaza a quien no es amigo y no guarda nada', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.friendship.findFirst.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/messages',
      headers,
      payload: { receiverId: 'user-2', content: 'Hola' },
    });

    expect(response.statusCode).toBe(403);
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });

  it('POST /api/messages rechaza contenido vacío, destinatario ausente o enviarse a uno mismo', async () => {
    const empty = await app.inject({
      method: 'POST',
      url: '/api/messages',
      headers,
      payload: { receiverId: 'user-2', content: '   ' },
    });
    const self = await app.inject({
      method: 'POST',
      url: '/api/messages',
      headers,
      payload: { receiverId: 'user-1', content: 'Hola' },
    });

    prismaMock.user.findUnique.mockResolvedValue(null);
    const missing = await app.inject({
      method: 'POST',
      url: '/api/messages',
      headers,
      payload: { receiverId: 'user-9', content: 'Hola' },
    });

    expect(empty.statusCode).toBe(400);
    expect(self.statusCode).toBe(400);
    expect(missing.statusCode).toBe(404);
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });

  it('PATCH /api/messages/:userId/read marca como leídos sólo los mensajes recibidos de ese usuario', async () => {
    prismaMock.message.updateMany.mockResolvedValue({ count: 2 });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/messages/user-2/read',
      headers,
    });

    expect(response.json()).toEqual({ success: true, updated: 2 });
    expect(prismaMock.message.updateMany).toHaveBeenCalledWith({
      where: { senderId: 'user-2', receiverId: testUser.id, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});
