import { Priority, Status } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { failure, getUserId } from '../lib/http';
import { taskSelect } from '../lib/taskSelect';

const taskIdSchema = z.object({ id: z.string().min(1) });
const taskDataSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(Status).optional(),
  categoryId: z.string().min(1).optional(),
});
const updateTaskSchema = taskDataSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Debe enviar al menos un campo para actualizar');
const taskQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  completed: z.enum(['true', 'false']).optional(),
});

function toStatusFilter(completed: 'true' | 'false' | undefined) {
  if (completed === undefined) return undefined;

  return completed === 'true' ? Status.COMPLETED : { not: Status.COMPLETED };
}

function parseTaskId(params: unknown) {
  const result = taskIdSchema.safeParse(params);

  return result.success ? result.data.id : undefined;
}

function findUserTask(id: string, userId: string) {
  return prisma.task.findFirst({ where: { id, userId }, select: taskSelect });
}

function deleteUserTask(id: string, userId: string) {
  return prisma.task.deleteMany({ where: { id, userId } });
}

async function findUserCategory(categoryId: string, userId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
}

async function categoryFailure(
  reply: FastifyReply,
  categoryId: string | undefined,
  userId: string,
) {
  if (categoryId === undefined || (await findUserCategory(categoryId, userId))) return undefined;

  return failure(reply, 404, 'Categoría no encontrada');
}

function taskNotFound(reply: FastifyReply) {
  return failure(reply, 404, 'Tarea no encontrada');
}

async function withValidCategory<T extends { categoryId?: string }, R>(
  reply: FastifyReply,
  data: T,
  userId: string,
  save: (data: T) => Promise<R>,
) {
  const missingCategory = await categoryFailure(reply, data.categoryId, userId);

  return missingCategory ?? save(data);
}

type TaskIdHandler = (id: string, userId: string, reply: FastifyReply) => Promise<unknown>;

function withTaskId(handler: TaskIdHandler) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const id = parseTaskId(request.params);

    if (!id) return failure(reply, 400, 'Id de tarea inválido');

    return handler(id, getUserId(request), reply);
  };
}

export default async function taskRoutes(app: FastifyInstance) {
  app.get('/api/tasks', { preHandler: app.authenticate }, async (request, reply) => {
    const queryResult = taskQuerySchema.safeParse(request.query);

    if (!queryResult.success) return failure(reply, 400, 'Filtros de tareas inválidos');

    const { categoryId, completed } = queryResult.data;

    return prisma.task.findMany({
      where: { userId: getUserId(request), categoryId, status: toStatusFilter(completed) },
      select: taskSelect,
      orderBy: { createdAt: 'asc' },
    });
  });

  app.get(
    '/api/tasks/:id',
    { preHandler: app.authenticate },
    withTaskId(
      async (id, userId, reply) => (await findUserTask(id, userId)) ?? taskNotFound(reply),
    ),
  );

  app.post('/api/tasks', { preHandler: app.authenticate }, async (request, reply) => {
    const bodyResult = taskDataSchema.safeParse(request.body);

    if (!bodyResult.success) return failure(reply, 400, 'Datos de tarea inválidos');

    const userId = getUserId(request);

    return withValidCategory(reply, bodyResult.data, userId, async (data) => {
      const task = await prisma.task.create({ data: { ...data, userId }, select: taskSelect });

      reply.status(201);
      return task;
    });
  });

  app.put('/api/tasks/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const paramsResult = taskIdSchema.safeParse(request.params);
    const bodyResult = updateTaskSchema.safeParse(request.body);

    if (!paramsResult.success || !bodyResult.success)
      return failure(reply, 400, 'Datos de tarea inválidos');

    const userId = getUserId(request);
    const task = await findUserTask(paramsResult.data.id, userId);

    if (!task) return taskNotFound(reply);

    return withValidCategory(reply, bodyResult.data, userId, (data) =>
      prisma.task.update({ where: { id: task.id }, data, select: taskSelect }),
    );
  });

  app.delete(
    '/api/tasks/:id',
    { preHandler: app.authenticate },
    withTaskId(async (id, userId, reply) => {
      const deletedTask = await deleteUserTask(id, userId);

      if (deletedTask.count === 0) return taskNotFound(reply);

      return { success: true, message: 'Tarea eliminada con éxito' };
    }),
  );
}
