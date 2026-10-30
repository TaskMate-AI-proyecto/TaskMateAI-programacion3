import { FastifyReply, FastifyRequest } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { failure, getUserId } from '../src/lib/http';
import { readProperty } from '../src/lib/objects';
import { generateChatReply, generateDailySummary, generateSubtasks } from '../src/services/gemini';

const generateContent = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

describe('lib/objects', () => {
  it('readProperty lee propiedades solo de objetos', () => {
    expect(readProperty({ status: 503 }, 'status')).toBe(503);
    expect(readProperty(null, 'status')).toBeUndefined();
    expect(readProperty('texto', 'length')).toBeUndefined();
  });
});

describe('lib/http', () => {
  it('failure fija el status y devuelve el cuerpo de error', () => {
    const reply = { status: vi.fn() };

    const body = failure(reply as unknown as FastifyReply, 404, 'No encontrado');

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(body).toEqual({ success: false, message: 'No encontrado' });
  });

  it('getUserId toma el id del usuario del JWT', () => {
    const request = { user: { id: 'user-1', email: 'ana@example.com' } };

    expect(getUserId(request as unknown as FastifyRequest)).toBe('user-1');
  });
});

describe('services/gemini', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('generateSubtasks interpreta JSON envuelto en un bloque de código', async () => {
    generateContent.mockResolvedValue({
      text: '```json\n{"subtasks":[" Leer ","Resumir","Repasar"]}\n```',
    });

    await expect(generateSubtasks('Estudiar', 'Parcial')).resolves.toEqual([
      'Leer',
      'Resumir',
      'Repasar',
    ]);
    expect(generateContent.mock.calls[0][0].contents).toContain('Descripción: Parcial');
  });

  it('generateSubtasks rechaza una cantidad de subtareas fuera de rango', async () => {
    generateContent.mockResolvedValue({ text: '{"subtasks":["Una","Dos"]}' });

    await expect(generateSubtasks('Estudiar')).rejects.toThrow('formato inválido');
  });

  it('reintenta ante errores transitorios de Gemini', async () => {
    vi.useFakeTimers();
    generateContent
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ text: '{"subtasks":["A","B","C"]}' });

    const result = generateSubtasks('Estudiar');
    await vi.runAllTimersAsync();

    await expect(result).resolves.toEqual(['A', 'B', 'C']);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('no reintenta errores no transitorios', async () => {
    generateContent.mockRejectedValue({ status: 400 });

    await expect(generateSubtasks('Estudiar')).rejects.toEqual({ status: 400 });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('generateDailySummary informa cuando no hay tareas y falla ante respuestas vacías', async () => {
    generateContent.mockResolvedValueOnce({ text: '  Día tranquilo.  ' });

    await expect(generateDailySummary([])).resolves.toBe('Día tranquilo.');
    expect(generateContent.mock.calls[0][0].contents).toContain('No hay tareas pendientes.');

    generateContent.mockResolvedValueOnce({ text: '   ' });

    await expect(generateDailySummary([])).rejects.toThrow('resumen vacío');
  });

  it('generateChatReply envía la conversación y las tareas, y devuelve la respuesta sin espacios', async () => {
    generateContent.mockResolvedValue({ text: '  Divídela en pasos.  ' });

    await expect(
      generateChatReply(
        '¿Cómo empiezo?',
        [{ role: 'user', text: 'Hola' }],
        [{ id: 'task-1', title: 'Entregar', description: null, priority: 'HIGH', dueDate: null }],
      ),
    ).resolves.toBe('Divídela en pasos.');

    const prompt = generateContent.mock.calls[0][0].contents as string;
    expect(prompt).toContain('- [task-1] Entregar | prioridad: HIGH | vence: sin fecha');
    expect(prompt).toContain('[COMMAND]{"action":"CREATE_TASK"');
    expect(prompt).toContain('Usuario: Hola');
    expect(prompt).toContain('Usuario: ¿Cómo empiezo?');
  });

  it('generateChatReply omite la conversación previa cuando no existe y falla ante respuestas vacías', async () => {
    generateContent.mockResolvedValueOnce({ text: 'Hola.' });

    await generateChatReply('Hola', [], []);

    const prompt = generateContent.mock.calls[0][0].contents as string;
    expect(prompt).not.toContain('Conversación previa');
    expect(prompt).toContain('No hay tareas pendientes.');

    generateContent.mockResolvedValueOnce({ text: '   ' });

    await expect(generateChatReply('Hola', [], [])).rejects.toThrow('respuesta vacía');
  });
});
