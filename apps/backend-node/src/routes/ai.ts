import { Status } from '@prisma/client';
import { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { failure, getUserId } from '../lib/http';
import { readProperty } from '../lib/objects';
import prisma from '../lib/prisma';
import { generateChatReply, generateDailySummary, generateSubtasks } from '../services/gemini';

const generateSubtasksSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
});

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().trim().min(1).max(2000),
      }),
    )
    .max(20)
    .optional(),
});

// Tareas pendientes del usuario: contexto para el resumen y para el chat.
function findPendingTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId, status: { not: Status.COMPLETED } },
    select: { title: true, description: true, priority: true, dueDate: true },
    orderBy: { dueDate: 'asc' },
    take: 50,
  });
}

type GeminiFailure = { statusCode: number; message: string };

const invalidKeyFailure: GeminiFailure = {
  statusCode: 400,
  message: 'La clave de la API de Gemini no es válida.',
};
const defaultFailure: GeminiFailure = {
  statusCode: 500,
  message: 'No se pudo completar la solicitud con Gemini.',
};

const failuresByGeminiStatus: Record<number, GeminiFailure> = {
  401: invalidKeyFailure,
  403: invalidKeyFailure,
  429: {
    statusCode: 429,
    message: 'Se agotó la cuota de Gemini. Intente nuevamente en unos minutos.',
  },
  503: {
    statusCode: 503,
    message: 'Gemini no está disponible temporalmente. Intente nuevamente más tarde.',
  },
};

function getGeminiErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('API_KEY_INVALID')) return invalidKeyFailure;

  const status = readProperty(error, 'status');

  return (
    (typeof status === 'number' ? failuresByGeminiStatus[status] : undefined) ?? defaultFailure
  );
}

function replyGeminiFailure(
  app: FastifyInstance,
  reply: FastifyReply,
  err: unknown,
  logMessage: string,
) {
  app.log.error({ err }, logMessage);
  const { statusCode, message } = getGeminiErrorResponse(err);

  return failure(reply, statusCode, message);
}

export default async function aiRoutes(app: FastifyInstance) {
  app.post(
    '/api/ai/generate-subtasks',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const bodyResult = generateSubtasksSchema.safeParse(request.body);

      if (!bodyResult.success) return failure(reply, 400, 'Datos para generar subtareas inválidos');

      try {
        const subtasks = await generateSubtasks(bodyResult.data.title, bodyResult.data.description);
        return { success: true, subtasks };
      } catch (err) {
        return replyGeminiFailure(app, reply, err, 'Error generating subtasks with Gemini');
      }
    },
  );

  app.post('/api/ai/summarize', { preHandler: app.authenticate }, async (request, reply) => {
    const tasks = await findPendingTasks(getUserId(request));

    try {
      const summary = await generateDailySummary(tasks);
      return { success: true, summary };
    } catch (err) {
      return replyGeminiFailure(app, reply, err, 'Error generating daily summary with Gemini');
    }
  });

  app.post('/api/ai/chat', { preHandler: app.authenticate }, async (request, reply) => {
    const bodyResult = chatSchema.safeParse(request.body);

    if (!bodyResult.success) return failure(reply, 400, 'Mensaje inválido');

    const tasks = await findPendingTasks(getUserId(request));

    try {
      const answer = await generateChatReply(
        bodyResult.data.message,
        bodyResult.data.history ?? [],
        tasks,
      );
      return { success: true, reply: answer };
    } catch (err) {
      return replyGeminiFailure(app, reply, err, 'Error generating chat reply with Gemini');
    }
  });
}
