import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { authHeaders, createTestApp, testUser } from './helpers';

const prismaMock = vi.hoisted(() => ({
  task: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  category: { findFirst: vi.fn() },
  friendship: { findMany: vi.fn(), updateMany: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

const sharedTask = { id: 'task-1', title: 'Proyecto', status: 'PENDING', assignedUsers: [] };

describe('tareas colaborativas', () => {
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
    prismaMock.friendship.findMany.mockResolvedValue([
      { senderId: testUser.id, receiverId: 'user-2', status: 'ACCEPTED' },
    ]);
  });

  it('crea una tarea compartida con un amigo', async () => {
    prismaMock.task.create.mockResolvedValue(sharedTask);

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers,
      payload: { title: 'Proyecto', collaboratorIds: ['user-2'] },
    });

    expect(response.statusCode).toBe(201);
    expect(prismaMock.task.create.mock.calls[0][0].data.assignedUsers).toEqual({
      connect: [{ id: 'user-2' }],
    });
  });

  it('no permite asignar tareas a quien no es amigo', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers,
      payload: { title: 'Proyecto', collaboratorIds: ['user-9'] },
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.task.create).not.toHaveBeenCalled();
  });

  it('sólo el dueño puede cambiar los colaboradores de una tarea', async () => {
    prismaMock.task.findFirst.mockResolvedValueOnce(sharedTask).mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/tasks/task-1',
      headers,
      payload: { collaboratorIds: ['user-2'] },
    });

    expect(response.statusCode).toBe(403);
    expect(prismaMock.task.update).not.toHaveBeenCalled();
  });

  it('el dueño reemplaza los colaboradores de una tarea', async () => {
    prismaMock.task.findFirst
      .mockResolvedValueOnce(sharedTask)
      .mockResolvedValueOnce({ id: 'task-1' });
    prismaMock.task.update.mockResolvedValue({ ...sharedTask, assignedUsers: [{ id: 'user-2' }] });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/tasks/task-1',
      headers,
      payload: { collaboratorIds: ['user-2'] },
    });

    expect(response.statusCode).toBe(200);
    expect(prismaMock.task.update.mock.calls[0][0].data.assignedUsers).toEqual({
      set: [{ id: 'user-2' }],
    });
  });
});
