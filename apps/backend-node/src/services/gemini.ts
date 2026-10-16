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

export async function generateDailySummary(
  tasks: Array<{
    title: string;
    description: string | null;
    priority: string;
    dueDate: Date | null;
  }>,
) {
  const client = await getClient();
  const taskList = tasks.length
    ? tasks
        .map(
          (task) =>
            `- ${task.title} | prioridad: ${task.priority} | vence: ${task.dueDate?.toISOString() ?? 'sin fecha'}${task.description ? ` | ${task.description}` : ''}`,
        )
        .join('\n')
    : 'No hay tareas pendientes.';
  const response = await withGeminiRetry(() =>
    client.models.generateContent({
      model,
      contents: `Elabora un resumen diario breve y accionable en español, priorizando las tareas urgentes. No uses Markdown.\nTareas pendientes:\n${taskList}`,
    }),
  );
  const summary = response.text?.trim();

  if (!summary) {
    throw new Error('Gemini devolvió un resumen vacío');
  }

  return summary;
}
