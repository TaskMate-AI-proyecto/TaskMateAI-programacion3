import { env } from '../config/env';
import { readProperty } from '../lib/objects';

const model = 'gemini-2.5-flash';
const maxAttempts = 3;
const initialRetryDelayMs = 500;
const transientStatuses = new Set([429, 500, 502, 503, 504]);
const transientCodes = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENETUNREACH']);

async function getClient() {
  const { GoogleGenAI } = await import('@google/genai');
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}

function parseJsonResponse(text: string) {
  const withoutFences = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const objectStart = withoutFences.indexOf('{');
  const objectEnd = withoutFences.lastIndexOf('}');
  const json =
    objectStart >= 0 && objectEnd > objectStart
      ? withoutFences.slice(objectStart, objectEnd + 1)
      : withoutFences;

  return JSON.parse(json) as unknown;
}

function isTransientGeminiError(error: unknown) {
  const status = readProperty(error, 'status');
  const code = readProperty(error, 'code');

  return (
    (typeof status === 'number' && transientStatuses.has(status)) ||
    (typeof code === 'string' && transientCodes.has(code))
  );
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function withGeminiRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientGeminiError(error) || attempt === maxAttempts) {
        throw error;
      }

      await wait(initialRetryDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSubtaskList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.length >= 3 && value.length <= 5 && value.every(isNonEmptyString)
  );
}

function parseSubtasks(text: string) {
  const subtasks = readProperty(parseJsonResponse(text), 'subtasks');

  if (!isSubtaskList(subtasks)) {
    throw new Error('Gemini devolvió subtareas con un formato inválido');
  }

  return subtasks.map((subtask) => subtask.trim());
}

export async function generateSubtasks(title: string, description?: string) {
  const client = await getClient();
  const response = await withGeminiRetry(() =>
    client.models.generateContent({
      model,
      contents: `Genera entre 3 y 5 subtareas concretas para completar esta tarea. Responde únicamente JSON válido con esta forma: {"subtasks":["..."]}.\nTítulo: ${title}${description ? `\nDescripción: ${description}` : ''}`,
      config: { responseMimeType: 'application/json' },
    }),
  );
  return parseSubtasks(response.text ?? '');
}

export interface PendingTask {
  title: string;
  description: string | null;
  priority: string;
  dueDate: Date | null;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

function formatPendingTasks(tasks: PendingTask[]) {
  if (tasks.length === 0) return 'No hay tareas pendientes.';

  return tasks
    .map(
      (task) =>
        `- ${task.title} | prioridad: ${task.priority} | vence: ${task.dueDate?.toISOString() ?? 'sin fecha'}${task.description ? ` | ${task.description}` : ''}`,
    )
    .join('\n');
}

export async function generateDailySummary(tasks: PendingTask[]) {
  const client = await getClient();
  const response = await withGeminiRetry(() =>
    client.models.generateContent({
      model,
      contents: `Elabora un resumen diario breve y accionable en español, priorizando las tareas urgentes. No uses Markdown.\nTareas pendientes:\n${formatPendingTasks(tasks)}`,
    }),
  );
  const summary = response.text?.trim();

  if (!summary) {
    throw new Error('Gemini devolvió un resumen vacío');
  }

  return summary;
}

export interface ChatContextTask extends PendingTask {
  id: string;
}

// Los ids van en la lista para que el modelo pueda referirse a una tarea existente al modificarla o borrarla.
function formatChatTasks(tasks: ChatContextTask[]) {
  if (tasks.length === 0) return 'No hay tareas pendientes.';

  return tasks
    .map(
      (task) =>
        `- [${task.id}] ${task.title} | prioridad: ${task.priority} | vence: ${task.dueDate?.toISOString() ?? 'sin fecha'}`,
    )
    .join('\n');
}

const chatInstructions = [
  'Eres TaskMate AI, un asistente de gestión de tareas. Responde en español, de forma breve y accionable, sin Markdown.',
  'Si el usuario pide crear, modificar o eliminar tareas, agrega al final un bloque por cada acción, con este formato exacto:',
  '[COMMAND]{"action":"CREATE_TASK","title":"...","description":"...","priority":"LOW|MEDIUM|HIGH","dueDate":"YYYY-MM-DD"}[/COMMAND]',
  '[COMMAND]{"action":"UPDATE_TASK","id":"<id de la lista>","status":"PENDING|COMPLETED","priority":"LOW|MEDIUM|HIGH","title":"..."}[/COMMAND]',
  '[COMMAND]{"action":"DELETE_TASK","id":"<id de la lista>"}[/COMMAND]',
  'Usa para UPDATE_TASK y DELETE_TASK sólo ids que aparezcan en la lista de tareas.',
].join('\n');

// Respuesta de la conversación. Devuelve el texto crudo: los bloques [COMMAND] los interpreta el backend.
export async function generateChatReply(
  message: string,
  history: ChatTurn[],
  tasks: ChatContextTask[],
) {
  const client = await getClient();
  const transcript = history
    .map((turn) => `${turn.role === 'user' ? 'Usuario' : 'Asistente'}: ${turn.text}`)
    .join('\n');
  const response = await withGeminiRetry(() =>
    client.models.generateContent({
      model,
      contents: [
        chatInstructions,
        `Tareas pendientes del usuario:\n${formatChatTasks(tasks)}`,
        transcript ? `Conversación previa:\n${transcript}` : '',
        `Usuario: ${message}\nAsistente:`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    }),
  );
  const reply = response.text?.trim();

  if (!reply) {
    throw new Error('Gemini devolvió una respuesta vacía');
  }

  return reply;
}
