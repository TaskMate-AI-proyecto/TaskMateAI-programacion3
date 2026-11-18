import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { authHeaders, createTestApp } from './helpers';

const prismaMock = vi.hoisted(() => ({
  task: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
  category: { findFirst: vi.fn() },
}));
const groq = vi.hoisted(() => ({
  generateSubtasks: vi.fn(),
  generateDailySummary: vi.fn(),
  generateChatReply: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));
vi.mock('../src/services/groq', () => groq);

function groqError(status: number, message = 'fallo de Groq') {
  return Object.assign(new Error(message), { status });
}

describe('rutas de IA', () => {
  let app: FastifyInstance;
  let headers: ReturnType<typeof authHeaders>;

  beforeAll(async () => {
    app = await createTestApp();
    headers = authHeaders(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/ai/generate-subtasks', () => {
    it('exige autenticación', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/generate-subtasks',
        payload: { title: 'Estudiar' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('rechaza un título vacío sin llamar a Groq', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/generate-subtasks',
        headers,
        payload: { title: '   ' },
      });

      expect(response.statusCode).toBe(400);
      expect(groq.generateSubtasks).not.toHaveBeenCalled();
    });

    it('devuelve las subtareas generadas', async () => {
      groq.generateSubtasks.mockResolvedValue(['Leer', 'Resumir', 'Repasar']);

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/generate-subtasks',
        headers,
        payload: { title: 'Estudiar', description: 'Parcial' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ success: true, subtasks: ['Leer', 'Resumir', 'Repasar'] });
      expect(groq.generateSubtasks).toHaveBeenCalledWith('Estudiar', 'Parcial');
    });

    it.each([
      [429, 429, 'Se agotó la cuota de Groq. Intente nuevamente en unos minutos.'],
      [503, 503, 'Groq no está disponible temporalmente. Intente nuevamente más tarde.'],
      [401, 400, 'La clave de la API de Groq no es válida.'],
      [403, 400, 'La clave de la API de Groq no es válida.'],
      [418, 500, 'No se pudo completar la solicitud con Groq.'],
    ])('traduce el status %i de Groq a %i', async (groqStatus, expectedStatus, expectedMessage) => {
      groq.generateSubtasks.mockRejectedValue(groqError(groqStatus));

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/generate-subtasks',
        headers,
        payload: { title: 'Estudiar' },
      });

      expect(response.statusCode).toBe(expectedStatus);
      expect(response.json()).toEqual({ success: false, message: expectedMessage });
    });

    it('trata una clave inválida anunciada en el mensaje como 400', async () => {
      groq.generateSubtasks.mockRejectedValue(new Error('API_KEY_INVALID: revisa la clave'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/generate-subtasks',
        headers,
        payload: { title: 'Estudiar' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('responde 500 ante errores que no son del proveedor', async () => {
      groq.generateSubtasks.mockRejectedValue('texto plano');

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/generate-subtasks',
        headers,
        payload: { title: 'Estudiar' },
      });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('POST /api/ai/summarize', () => {
    it('resume solo las tareas pendientes del usuario', async () => {
      prismaMock.task.findMany.mockResolvedValue([{ title: 'Entregar', priority: 'HIGH' }]);
      groq.generateDailySummary.mockResolvedValue('Hoy: entregar.');

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/summarize',
        headers,
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ success: true, summary: 'Hoy: entregar.' });
      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', status: { not: 'COMPLETED' } } }),
      );
      expect(groq.generateDailySummary).toHaveBeenCalledWith([
        { title: 'Entregar', priority: 'HIGH' },
      ]);
    });

    it('mapea los fallos de Groq del resumen', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      groq.generateDailySummary.mockRejectedValue(groqError(503));

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/summarize',
        headers,
        payload: {},
      });

      expect(response.statusCode).toBe(503);
      expect(response.json().success).toBe(false);
    });

    it('exige autenticación', async () => {
      const response = await app.inject({ method: 'POST', url: '/api/ai/summarize', payload: {} });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/ai/chat', () => {
    it('exige autenticación', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        payload: { message: 'hola' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('rechaza un mensaje vacío o un historial demasiado largo sin llamar a Groq', async () => {
      const empty = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers,
        payload: { message: '  ' },
      });
      const tooLong = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers,
        payload: {
          message: 'hola',
          history: Array.from({ length: 21 }, () => ({ role: 'user', text: 'x' })),
        },
      });

      expect(empty.statusCode).toBe(400);
      expect(tooLong.statusCode).toBe(400);
      expect(groq.generateChatReply).not.toHaveBeenCalled();
    });

    it('responde con el texto de Groq usando las tareas pendientes y el historial', async () => {
      prismaMock.task.findMany.mockResolvedValue([{ title: 'Entregar', priority: 'HIGH' }]);
      groq.generateChatReply.mockResolvedValue('Divídela en tres pasos.');
      const history = [
        { role: 'user', text: 'Hola' },
        { role: 'assistant', text: '¡Hola!' },
      ];

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers,
        payload: { message: 'Divide Entregar', history },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        success: true,
        reply: 'Divídela en tres pasos.',
        changes: { created: [], updated: [], deletedIds: [] },
      });
      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', status: { not: 'COMPLETED' } },
          take: 50,
        }),
      );
      expect(groq.generateChatReply).toHaveBeenCalledWith('Divide Entregar', history, [
        { title: 'Entregar', priority: 'HIGH' },
      ]);
    });

    it('pasa la personalidad y las instrucciones elegidas en Ajustes al prompt de Groq', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      groq.generateChatReply.mockResolvedValue('Listo.');

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers,
        payload: {
          message: 'Hola',
          assistant: {
            personality: 'concise',
            instructions: 'Responde siempre en tercera persona',
          },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(groq.generateChatReply).toHaveBeenCalledWith('Hola', [], [], {
        personality: 'concise',
        instructions: 'Responde siempre en tercera persona',
      });
    });

    it('rechaza una personalidad que no existe', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers,
        payload: { message: 'Hola', assistant: { personality: 'sarcastic' } },
      });

      expect(response.statusCode).toBe(400);
      expect(groq.generateChatReply).not.toHaveBeenCalled();
    });

    it('usa historial vacío cuando no se envía', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      groq.generateChatReply.mockResolvedValue('Hola.');

      await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers,
        payload: { message: 'Hola' },
      });

      expect(groq.generateChatReply).toHaveBeenLastCalledWith('Hola', [], []);
    });

    it('ejecuta los comandos de la respuesta y devuelve las tareas creadas, editadas y eliminadas', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.create.mockResolvedValue({ id: 'nueva', title: 'Comprar pan' });
      prismaMock.task.findFirst.mockResolvedValue({ id: 'task-1' });
      prismaMock.task.update.mockResolvedValue({
        id: 'task-1',
        title: 'Entregar TP',
        status: 'COMPLETED',
      });
      prismaMock.task.deleteMany.mockResolvedValue({ count: 1 });
      groq.generateChatReply.mockResolvedValue(
        [
          'Hecho.',
          '[COMMAND]{"action":"CREATE_TASK","title":"Comprar pan"}[/COMMAND]',
          '[COMMAND]{"action":"UPDATE_TASK","id":"task-1","status":"COMPLETED"}[/COMMAND]',
          '[COMMAND]{"action":"DELETE_TASK","id":"task-2"}[/COMMAND]',
        ].join('\n'),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers,
        payload: { message: 'crear tarea comprar pan y completar la 1' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.reply).toBe('Hecho.');
      expect(body.changes.created).toEqual([{ id: 'nueva', title: 'Comprar pan' }]);
      expect(body.changes.updated).toEqual([
        { id: 'task-1', title: 'Entregar TP', status: 'COMPLETED' },
      ]);
      expect(body.changes.deletedIds).toEqual(['task-2']);
      expect(prismaMock.task.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
      );
    });

    it('mapea los fallos de Groq en el chat', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      groq.generateChatReply.mockRejectedValue(groqError(429));

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/chat',
        headers,
        payload: { message: 'Hola' },
      });

      expect(response.statusCode).toBe(429);
      expect(response.json().success).toBe(false);
    });
  });
});
