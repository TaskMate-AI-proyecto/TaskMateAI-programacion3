import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { authHeaders, createTestApp } from './helpers';

const prismaMock = vi.hoisted(() => ({
  category: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

const storedCategory = { id: 'cat-1', name: 'Facultad', color: '#22c55e' };

describe('rutas de categorías', () => {
  let app: FastifyInstance;
  let headers: ReturnType<typeof authHeaders>;

  beforeAll(async () => {
    app = await createTestApp();
    headers = authHeaders(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('exige autenticación para listar', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/categories' });

    expect(response.statusCode).toBe(401);
  });

  it('lista solo las categorías del usuario autenticado', async () => {
    prismaMock.category.findMany.mockResolvedValue([storedCategory]);

    const response = await app.inject({ method: 'GET', url: '/api/categories', headers });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([storedCategory]);
    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  it('crea una categoría con 201 y el dueño del JWT', async () => {
    prismaMock.category.create.mockResolvedValue(storedCategory);

    const response = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers,
      payload: { name: '  Facultad  ', color: '#22c55e' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(storedCategory);
    expect(prismaMock.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Facultad', color: '#22c55e', userId: 'user-1' } }),
    );
  });

  it('rechaza crear una categoría con color inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers,
      payload: { name: 'Facultad', color: 'rojo' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ success: false, message: 'Datos de categoría inválidos' });
    expect(prismaMock.category.create).not.toHaveBeenCalled();
  });

  it('actualiza una categoría del usuario y devuelve la versión guardada', async () => {
    prismaMock.category.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.category.findFirst.mockResolvedValue({ ...storedCategory, name: 'Trabajo' });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/categories/cat-1',
      headers,
      payload: { name: 'Trabajo' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: 'cat-1', name: 'Trabajo' });
    expect(prismaMock.category.updateMany).toHaveBeenCalledWith({
      where: { id: 'cat-1', userId: 'user-1' },
      data: { name: 'Trabajo' },
    });
  });

  it('responde 404 al actualizar una categoría ajena o inexistente', async () => {
    prismaMock.category.updateMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({
      method: 'PUT',
      url: '/api/categories/otra',
      headers,
      payload: { color: '#000000' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ success: false, message: 'Categoría no encontrada' });
  });

  it('rechaza una actualización sin campos', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/categories/cat-1',
      headers,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.category.updateMany).not.toHaveBeenCalled();
  });

  it('elimina una categoría del usuario', async () => {
    prismaMock.category.deleteMany.mockResolvedValue({ count: 1 });

    const response = await app.inject({ method: 'DELETE', url: '/api/categories/cat-1', headers });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true, message: 'Categoría eliminada con éxito' });
    expect(prismaMock.category.deleteMany).toHaveBeenCalledWith({
      where: { id: 'cat-1', userId: 'user-1' },
    });
  });

  it('responde 404 al eliminar una categoría que no existe para el usuario', async () => {
    prismaMock.category.deleteMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({ method: 'DELETE', url: '/api/categories/x', headers });

    expect(response.statusCode).toBe(404);
  });
});
