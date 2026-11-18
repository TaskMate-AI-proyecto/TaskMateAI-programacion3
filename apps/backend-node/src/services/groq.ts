import { env } from '../config/env';
import { readProperty } from '../lib/objects';

// Groq expone una API compatible con OpenAI: chat completions con un modelo Llama.
const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
const maxAttempts = 3;
const initialRetryDelayMs = 500;
const requestTimeoutMs = 30_000;
const transientStatuses = new Set([429, 500, 502, 503, 504]);
const transientCodes = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENETUNREACH']);

export class GroqRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Groq respondió con el estado ${status}`);
    this.name = 'GroqRequestError';
    this.status = status;
  }
}

interface CompletionOptions {
  json?: boolean;
  // Instrucción de sistema: el formato de respuesta que debe seguir el modelo.
  system?: string;
}

// Formato de las respuestas del asistente: párrafos y listas limpias, sin Markdown crudo.
export const answerFormatInstruction =
  'Responde usando párrafos separados por una línea en blanco y listas con viñetas o numeradas en líneas separadas. No uses sintaxis Markdown cruda como doble asterisco (**); escribe en texto limpio, claro y bien espaciado.';

function completionText(data: unknown) {
  const choices = readProperty(data, 'choices');
  const first: unknown = Array.isArray(choices) ? choices[0] : undefined;
  const content = readProperty(readProperty(first, 'message'), 'content');

  return typeof content === 'string' ? content : '';
}

// Una llamada HTTP a Groq. Un estado de error se lanza con su `status` para que el reintento y la traducción de errores lo lean.
async function sendCompletion(prompt: string, options: CompletionOptions) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      messages: [
        ...(options.system ? [{ role: 'system', content: options.system }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) throw new GroqRequestError(response.status);

  return completionText(await response.json());
}

function isTransientGroqError(error: unknown) {
  const status = readProperty(error, 'status');
  const code = readProperty(error, 'code') ?? readProperty(readProperty(error, 'cause'), 'code');

  return (
    (typeof status === 'number' && transientStatuses.has(status)) ||
    (typeof code === 'string' && transientCodes.has(code))
  );
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function withGroqRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientGroqError(error) || attempt === maxAttempts) {
        throw error;
      }

      await wait(initialRetryDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}

async function complete(prompt: string, options: CompletionOptions = {}) {
  return withGroqRetry(() => sendCompletion(prompt, options));
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
    throw new Error('Groq devolvió subtareas con un formato inválido');
  }

  return subtasks.map((subtask) => subtask.trim());
}

export async function generateSubtasks(title: string, description?: string) {
  return parseSubtasks(
    await complete(
      `Genera entre 3 y 5 subtareas concretas para completar esta tarea. Responde únicamente JSON válido con esta forma: {"subtasks":["..."]}.\nTítulo: ${title}${description ? `\nDescripción: ${description}` : ''}`,
      { json: true },
    ),
  );
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
  const summary = (
    await complete(
      `Elabora un resumen diario breve y accionable en español, priorizando las tareas urgentes.\nTareas pendientes:\n${formatPendingTasks(tasks)}`,
      { system: answerFormatInstruction },
    )
  ).trim();

  if (!summary) {
    throw new Error('Groq devolvió un resumen vacío');
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
  '[COMMAND]{"action":"UPDATE_TASK","id":"<id de la lista>","status":"PENDING|IN_PROGRESS|IN_REVIEW|COMPLETED","priority":"LOW|MEDIUM|HIGH","title":"..."}[/COMMAND]',
  '[COMMAND]{"action":"DELETE_TASK","id":"<id de la lista>"}[/COMMAND]',
  'Usa para UPDATE_TASK y DELETE_TASK sólo ids que aparezcan en la lista de tareas.',
].join('\n');

export type AssistantPersonality = 'professional' | 'concise' | 'technical' | 'motivational';

export interface AssistantStyle {
  personality: AssistantPersonality;
  instructions?: string;
}

const personalityInstructions: Record<AssistantPersonality, string> = {
  professional: 'Adopta un tono profesional y cordial.',
  concise: 'Sé muy conciso: como máximo dos frases.',
  technical: 'Usa lenguaje técnico y precisa los detalles de implementación cuando sea útil.',
  motivational: 'Anima al usuario con un tono motivador y positivo.',
};

// Estilo elegido por el usuario en Ajustes. Las instrucciones libres se añaden tal cual, como indicación extra.
function styleInstructions(style?: AssistantStyle) {
  if (!style) return '';

  return [
    personalityInstructions[style.personality],
    style.instructions ? `Instrucciones del usuario: ${style.instructions}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// Respuesta de la conversación. Devuelve el texto crudo: los bloques [COMMAND] los interpreta el backend.
export async function generateChatReply(
  message: string,
  history: ChatTurn[],
  tasks: ChatContextTask[],
  style?: AssistantStyle,
) {
  const transcript = history
    .map((turn) => `${turn.role === 'user' ? 'Usuario' : 'Asistente'}: ${turn.text}`)
    .join('\n');
  const reply = (
    await complete(
      [
        chatInstructions,
        styleInstructions(style),
        `Tareas pendientes del usuario:\n${formatChatTasks(tasks)}`,
        transcript ? `Conversación previa:\n${transcript}` : '',
        `Usuario: ${message}\nAsistente:`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      { system: answerFormatInstruction },
    )
  ).trim();

  if (!reply) {
    throw new Error('Groq devolvió una respuesta vacía');
  }

  return reply;
}
