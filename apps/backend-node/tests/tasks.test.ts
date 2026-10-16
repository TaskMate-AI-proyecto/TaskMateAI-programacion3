import { Status } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { authHeaders, createTestApp, testUser } from './helpers';

const prismaMock = vi.hoisted(() => ({
  task: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  category: { findFirst: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

const storedTask = { id: 'task-1', title: 'Estudiar', status: Status.PENDING };

describe('rutas de tareas', () => {
  let app: FastifyInstance;
  let headers: ReturnType<typeof authHeaders>;

  beforeAll(async () => {
    app = await createTestApp();
    headers = authHeaders(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('exige autenticación', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/tasks' });

    expect(response.statusCode).toBe(401);
    expect(prismaMock.task.findMany).not.toHaveBeenCalled();
  });

  describe('GET /api/tasks', () => {
    it('lista solo las tareas del usuario y traduce el filtro de completadas', async () => {
      prismaMock.task.findMany.mockResolvedValue([storedTask]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/tasks?completed=false&categoryId=cat-1',
        headers,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([storedTask]);
      expect(prismaMock.task.findMany.mock.calls[0][0].where).toEqual({
        userId: testUser.id,
        categoryId: 'cat-1',
        status: { not: Status.COMPLETED },
      });
    });

    it('rechaza filtros inválidos', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tasks?completed=quizas',
        headers,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('devuelve la tarea si pertenece al usuario', async () => {
      prismaMock.task.findFirst.mockResolvedValue(storedTask);

      const response = await app.inject({ method: 'GET', url: '/api/tasks/task-1', headers });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(storedTask);
      expect(prismaMock.task.findFirst.mock.calls[0][0].where).toEqual({
        id: 'task-1',
        userId: testUser.id,
      });
    });

    it('responde 404 si la tarea no existe o es de otro usuario', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      const response = await app.inject({ method: 'GET', url: '/api/tasks/ajena', headers });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ success: false, message: 'Tarea no encontrada' });
    });
  });

  describe('POST /api/tasks', () => {
    it('rechaza una tarea sin título', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        headers,
        payload: { title: '   ' },
      });

      expect(response.statusCode).toBe(400);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('no permite usar una categoría de otro usuario', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        headers,
        payload: { title: 'Estudiar', categoryId: 'cat-ajena' },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ success: false, message: 'Categoría no encontrada' });
      expect(prismaMock.category.findFirst.mock.calls[0][0].where).toEqual({
        id: 'cat-ajena',
        userId: testUser.id,
      });
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('crea la tarea asociada al usuario y responde 201', async () => {
      prismaMock.category.findFirst.mockResolvedValue({ id: 'cat-1' });
      prismaMock.task.create.mockResolvedValue(storedTask);

      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        headers,
        payload: { title: ' Estudiar ', categoryId: 'cat-1' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(storedTask);
      expect(prismaMock.task.create.mock.calls[0][0].data).toEqual({
        title: 'Estudiar',
        categoryId: 'cat-1',
        userId: testUser.id,
      });
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('rechaza una actualización vacía', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/tasks/task-1',
        headers,
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('responde 404 si la tarea no es del usuario', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/tasks/ajena',
        headers,
        payload: { status: Status.COMPLETED },
      });

      expect(response.statusCode).toBe(404);
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('actualiza solo los campos enviados', async () => {
      prismaMock.task.findFirst.mockResolvedValue(storedTask);
      prismaMock.task.update.mockResolvedValue({ ...storedTask, status: Status.COMPLETED });

      const response = await app.inject({
        method: 'PUT',
        url: '/api/tasks/task-1',
        headers,
        payload: { status: Status.COMPLETED },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status: Status.COMPLETED });
      expect(prismaMock.task.update.mock.calls[0][0]).toMatchObject({
        where: { id: 'task-1' },
        data: { status: Status.COMPLETED },
      });
      expect(prismaMock.category.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('responde 404 si no borró ninguna tarea', async () => {
      prismaMock.task.deleteMany.mockResolvedValue({ count: 0 });

      const response = await app.inject({ method: 'DELETE', url: '/api/tasks/ajena', headers });

      expect(response.statusCode).toBe(404);
    });

    it('borra solo tareas del usuario', async () => {
      prismaMock.task.deleteMany.mockResolvedValue({ count: 1 });

      const response = await app.inject({ method: 'DELETE', url: '/api/tasks/task-1', headers });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ success: true, message: 'Tarea eliminada con éxito' });
      expect(prismaMock.task.deleteMany).toHaveBeenCalledWith({
        where: { id: 'task-1', userId: testUser.id },
      });
    });
  });
});
