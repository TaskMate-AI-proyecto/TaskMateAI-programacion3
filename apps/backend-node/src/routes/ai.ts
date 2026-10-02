import { Status } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { generateDailySummary, generateSubtasks } from '../services/gemini';

const generateSubtasksSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
});

type JwtUser = {
  id: string;
};

function getGeminiErrorResponse(error: unknown) {
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  const message = error instanceof Error ? error.message : '';

  if (message.includes('API_KEY_INVALID')) {
    return { statusCode: 400, message: 'La clave de la API de Gemini no es válida.' };
  }

  if (status === 503) {
    return { statusCode: 503, message: 'Gemini no está disponible temporalmente. Intente nuevamente más tarde.' };
  }

  return { statusCode: 500, message: 'No se pudo completar la solicitud con Gemini.' };
}

export default async function aiRoutes(app: FastifyInstance) {
  app.post('/api/ai/generate-subtasks', { preHandler: app.authenticate }, async (request, reply) => {
    const bodyResult = generateSubtasksSchema.safeParse(request.body);

    if (!bodyResult.success) {
      reply.status(400);
      return { success: false, message: 'Datos para generar subtareas inválidos' };
    }

    try {
      const subtasks = await generateSubtasks(bodyResult.data.title, bodyResult.data.description);
      return { success: true, subtasks };
    } catch (err) {
      app.log.error({ err }, 'Error generating subtasks with Gemini');
      const errorResponse = getGeminiErrorResponse(err);
      reply.status(errorResponse.statusCode);
      return { success: false, message: errorResponse.message };
    }
  });

  app.post('/api/ai/summarize', { preHandler: app.authenticate }, async (request, reply) => {
    const { id: userId } = request.user as JwtUser;
    const tasks = await prisma.task.findMany({
      where: { userId, status: { not: Status.COMPLETED } },
      select: { title: true, description: true, priority: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
    });

    try {
      const summary = await generateDailySummary(tasks);
      return { success: true, summary };
    } catch (err) {
      app.log.error({ err }, 'Error generating daily summary with Gemini');
      const errorResponse = getGeminiErrorResponse(err);
      reply.status(errorResponse.statusCode);
      return { success: false, message: errorResponse.message };
    }
  });
}