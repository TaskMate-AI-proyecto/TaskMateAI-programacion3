import { env } from '../config/env';

const model = 'gemini-2.5-flash';
const maxAttempts = 3;
const initialRetryDelayMs = 500;

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
  const json = objectStart >= 0 && objectEnd > objectStart ? withoutFences.slice(objectStart, objectEnd + 1) : withoutFences;

  return JSON.parse(json) as unknown;
}

function isTransientGeminiError(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const status = 'status' in error ? error.status : undefined;
  const code = 'code' in error ? error.code : undefined;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ENETUNREACH'
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

export async function generateSubtasks(title: string, description?: string) {
  const client = await getClient();
  const response = await withGeminiRetry(() =>
    client.models.generateContent({
      model,
      contents: `Genera entre 3 y 5 subtareas concretas para completar esta tarea. Responde únicamente JSON válido con esta forma: {"subtasks":["..."]}.\nTítulo: ${title}${description ? `\nDescripción: ${description}` : ''}`,
      config: { responseMimeType: 'application/json' },
    }),
  );
  const result = parseJsonResponse(response.text ?? '');

  if (
    !result ||
    typeof result !== 'object' ||
    !('subtasks' in result) ||
    !Array.isArray(result.subtasks) ||
    result.subtasks.length < 3 ||
    result.subtasks.length > 5 ||
    !result.subtasks.every((subtask) => typeof subtask === 'string' && subtask.trim().length > 0)
  ) {
    throw new Error('Gemini devolvió subtareas con un formato inválido');
  }

  return result.subtasks.map((subtask) => subtask.trim());
}

export async function generateDailySummary(tasks: Array<{ title: string; description: string | null; priority: string; dueDate: Date | null }>) {
  const client = await getClient();
  const taskList = tasks.length
    ? tasks
        .map(
          (task) => `- ${task.title} | prioridad: ${task.priority} | vence: ${task.dueDate?.toISOString() ?? 'sin fecha'}${task.description ? ` | ${task.description}` : ''}`,
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