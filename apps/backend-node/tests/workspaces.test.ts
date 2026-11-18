import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { authHeaders, createTestApp, testUser } from './helpers';

const prismaMock = vi.hoisted(() => ({
  friendship: { findMany: vi.fn(), updateMany: vi.fn() },
  workspace: { findMany: vi.fn(), create: vi.fn() },
  workspaceMember: { findUnique: vi.fn(), createMany: vi.fn() },
  task: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  category: { findFirst: vi.fn() },
  message: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

const bob = { id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' };
const workspaceRow = {
  id: 'ws-1',
  name: 'Proyecto final',
  icon: 'folder',
  color: '#6366F1',
  ownerId: testUser.id,
  createdAt: new Date('2026-11-01T00:00:00Z'),
  members: [
    { role: 'OWNER', user: { id: testUser.id, uniqueTag: '@ana_8f9a2c' } },
    { role: 'MEMBER', user: { id: bob.id, uniqueTag: bob.uniqueTag } },
  ],
};

describe('espacios compartidos', () => {
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
    // Amistad aceptada con bob: es el único amigo válido para invitar.
    prismaMock.friendship.findMany.mockResolvedValue([
      { senderId: testUser.id, receiverId: bob.id, status: 'ACCEPTED' },
    ]);
  });

  describe('POST /api/workspaces', () => {
    it('crea el espacio con el usuario como dueño e invita a los amigos seleccionados', async () => {
      prismaMock.workspace.create.mockResolvedValue(workspaceRow);

      const response = await app.inject({
        method: 'POST',
        url: '/api/workspaces',
        headers,
        payload: { name: 'Proyecto final', memberIds: [bob.id] },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject({
        id: 'ws-1',
        role: 'OWNER',
        shared: false,
        memberCount: 2,
      });
      const data = prismaMock.workspace.create.mock.calls[0][0].data;
      expect(data.ownerId).toBe(testUser.id);
      expect(data.members.create).toEqual([
        { userId: testUser.id, role: 'OWNER' },
        { userId: bob.id, role: 'MEMBER' },
      ]);
    });

    it('rechaza invitar a alguien que no es amigo', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/workspaces',
        headers,
        payload: { name: 'Proyecto', memberIds: ['user-9'] },
      });

      expect(response.statusCode).toBe(400);
      expect(prismaMock.workspace.create).not.toHaveBeenCalled();
    });

    it('exige nombre', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/workspaces',
        headers,
        payload: { name: '  ' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/workspaces', () => {
    it('lista mis espacios con miembros, mi rol y las tareas pendientes', async () => {
      prismaMock.workspace.findMany.mockResolvedValue([
        { ...workspaceRow, ownerId: bob.id, tasks: [{ id: 't1' }, { id: 't2' }] },
      ]);

      const response = await app.inject({ method: 'GET', url: '/api/workspaces', headers });

      expect(response.statusCode).toBe(200);
      expect(response.json()[0]).toMatchObject({
        shared: true,
        role: 'OWNER',
        memberCount: 2,
        pendingTasks: 2,
      });
      expect(prismaMock.workspace.findMany.mock.calls[0][0].where).toEqual({
        members: { some: { userId: testUser.id } },
      });
    });
  });

  describe('POST /api/workspaces/:id/members', () => {
    it('no deja añadir miembros a un espacio del que no soy miembro', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/workspaces/ws-1/members',
        headers,
        payload: { memberIds: [bob.id] },
      });

      expect(response.statusCode).toBe(404);
      expect(prismaMock.workspaceMember.createMany).not.toHaveBeenCalled();
    });

    it('añade amigos aceptados e ignora los que ya estaban', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      prismaMock.workspaceMember.createMany.mockResolvedValue({ count: 1 });

      const response = await app.inject({
        method: 'POST',
        url: '/api/workspaces/ws-1/members',
        headers,
        payload: { memberIds: [bob.id] },
      });

      expect(response.json()).toEqual({ success: true, added: 1 });
      expect(prismaMock.workspaceMember.createMany.mock.calls[0][0]).toMatchObject({
        data: [{ workspaceId: 'ws-1', userId: bob.id, role: 'MEMBER' }],
        skipDuplicates: true,
      });
    });

    it('no añade a alguien que no es amigo', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: 'OWNER' });

      const response = await app.inject({
        method: 'POST',
        url: '/api/workspaces/ws-1/members',
        headers,
        payload: { memberIds: ['user-9'] },
      });

      expect(response.statusCode).toBe(400);
      expect(prismaMock.workspaceMember.createMany).not.toHaveBeenCalled();
    });
  });

  describe('filtro por espacio', () => {
    it('GET /api/tasks?workspaceId= filtra por ese espacio', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);

      await app.inject({ method: 'GET', url: '/api/tasks?workspaceId=ws-1', headers });

      expect(prismaMock.task.findMany.mock.calls[0][0].where).toMatchObject({
        workspaceId: 'ws-1',
      });
    });

    it('POST /api/tasks en un espacio ajeno responde 404', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        headers,
        payload: { title: 'Tarea', workspaceId: 'ws-9' },
      });

      expect(response.statusCode).toBe(404);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });
  });

  describe('chat grupal del espacio', () => {
    it('envía un mensaje al canal grupal si soy miembro', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      prismaMock.message.create.mockResolvedValue({
        id: 'm1',
        content: 'Hola equipo',
        workspaceId: 'ws-1',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/messages',
        headers,
        payload: { workspaceId: 'ws-1', content: 'Hola equipo' },
      });

      expect(response.statusCode).toBe(201);
      expect(prismaMock.message.create.mock.calls[0][0].data).toEqual({
        senderId: testUser.id,
        workspaceId: 'ws-1',
        content: 'Hola equipo',
      });
    });

    it('no deja leer el canal de un espacio del que no soy miembro', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/messages?workspaceId=ws-9',
        headers,
      });

      expect(response.statusCode).toBe(404);
      expect(prismaMock.message.findMany).not.toHaveBeenCalled();
    });

    it('lee el historial del canal filtrado por espacio', async () => {
      prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      prismaMock.message.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/messages?workspaceId=ws-1',
        headers,
      });

      expect(response.statusCode).toBe(200);
      expect(prismaMock.message.findMany.mock.calls[0][0].where).toEqual({ workspaceId: 'ws-1' });
    });
  });
});
