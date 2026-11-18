import { FastifyReply, FastifyRequest } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { failure, getUserId } from '../src/lib/http';
import { readProperty } from '../src/lib/objects';
import { generateChatReply, generateDailySummary, generateSubtasks } from '../src/services/groq';

const fetchMock = vi.hoisted(() => vi.fn());

// Respuesta de chat completions de Groq con el texto indicado.
function completion(text: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), {
    status: 200,
  });
}

// Prompt enviado en la llamada n-ésima a Groq.
function sentPrompt(call: number) {
  const init = fetchMock.mock.calls[call][1] as RequestInit;
  const body: { messages: { content: string }[] } = JSON.parse(String(init.body));

  // El último mensaje es el del usuario; un mensaje de sistema puede ir antes.
  return body.messages[body.messages.length - 1].content;
}

vi.stubGlobal('fetch', fetchMock);

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

describe('services/groq', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('generateSubtasks interpreta JSON envuelto en un bloque de código', async () => {
    fetchMock.mockResolvedValue(
      completion('```json\n{"subtasks":[" Leer ","Resumir","Repasar"]}\n```'),
    );

    await expect(generateSubtasks('Estudiar', 'Parcial')).resolves.toEqual([
      'Leer',
      'Resumir',
      'Repasar',
    ]);
    expect(sentPrompt(0)).toContain('Descripción: Parcial');
  });

  it('generateSubtasks rechaza una cantidad de subtareas fuera de rango', async () => {
    fetchMock.mockResolvedValue(completion('{"subtasks":["Una","Dos"]}'));

    await expect(generateSubtasks('Estudiar')).rejects.toThrow('formato inválido');
  });

  it('reintenta ante errores transitorios de Groq', async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(completion('{"subtasks":["A","B","C"]}'));

    const result = generateSubtasks('Estudiar');
    await vi.runAllTimersAsync();

    await expect(result).resolves.toEqual(['A', 'B', 'C']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no reintenta errores no transitorios', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 400 }));

    await expect(generateSubtasks('Estudiar')).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('generateDailySummary informa cuando no hay tareas y falla ante respuestas vacías', async () => {
    fetchMock.mockResolvedValueOnce(completion('  Día tranquilo.  '));

    await expect(generateDailySummary([])).resolves.toBe('Día tranquilo.');
    expect(sentPrompt(0)).toContain('No hay tareas pendientes.');

    fetchMock.mockResolvedValueOnce(completion('   '));

    await expect(generateDailySummary([])).rejects.toThrow('resumen vacío');
  });

  it('generateChatReply envía la conversación y las tareas, y devuelve la respuesta sin espacios', async () => {
    fetchMock.mockResolvedValue(completion('  Divídela en pasos.  '));

    await expect(
      generateChatReply(
        '¿Cómo empiezo?',
        [{ role: 'user', text: 'Hola' }],
        [{ id: 'task-1', title: 'Entregar', description: null, priority: 'HIGH', dueDate: null }],
      ),
    ).resolves.toBe('Divídela en pasos.');

    const prompt = sentPrompt(0);
    expect(prompt).toContain('- [task-1] Entregar | prioridad: HIGH | vence: sin fecha');
    expect(prompt).toContain('[COMMAND]{"action":"CREATE_TASK"');
    expect(prompt).toContain('Usuario: Hola');
    expect(prompt).toContain('Usuario: ¿Cómo empiezo?');
  });

  it('generateChatReply omite la conversación previa cuando no existe y falla ante respuestas vacías', async () => {
    fetchMock.mockResolvedValueOnce(completion('Hola.'));

    await generateChatReply('Hola', [], []);

    const prompt = sentPrompt(0);
    expect(prompt).not.toContain('Conversación previa');
    expect(prompt).toContain('No hay tareas pendientes.');

    fetchMock.mockResolvedValueOnce(completion('   '));

    await expect(generateChatReply('Hola', [], [])).rejects.toThrow('respuesta vacía');
  });
});
