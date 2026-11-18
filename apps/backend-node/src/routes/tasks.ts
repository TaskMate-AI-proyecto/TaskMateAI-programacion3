import { Priority, Status } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { failure, getUserId } from '../lib/http';
import { taskSelect } from '../lib/taskSelect';
import { visibleTo } from '../lib/taskVisibility';
import { acceptedFriendIds } from '../services/friends';
import { isWorkspaceMember } from '../services/workspaces.service';
import { recordTaskCompletion } from '../services/gamification.service';

const taskIdSchema = z.object({ id: z.string().min(1) });
const taskDataSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(Status).optional(),
  categoryId: z.string().min(1).optional(),
  // Espacio compartido al que pertenece la tarea: hay que ser miembro.
  workspaceId: z.string().min(1).optional(),
  // Amigos con los que se comparte la tarea (sólo amistades aceptadas).
  collaboratorIds: z.array(z.string().min(1)).max(20).optional(),
});
const updateTaskSchema = taskDataSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Debe enviar al menos un campo para actualizar');
const taskQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  workspaceId: z.string().min(1).optional(),
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
  return prisma.task.findFirst({ where: { id, ...visibleTo(userId) }, select: taskSelect });
}

function isTaskOwner(id: string, userId: string) {
  return prisma.task
    .findFirst({ where: { id, userId }, select: { id: true } })
    .then((task) => task !== null);
}

// Sólo se puede compartir una tarea con amigos con solicitud aceptada.
async function collaboratorsFailure(
  reply: FastifyReply,
  ids: string[] | undefined,
  userId: string,
) {
  if (!ids || ids.length === 0) return undefined;

  const friends = await acceptedFriendIds(userId);

  return ids.every((id) => friends.includes(id))
    ? undefined
    : failure(reply, 400, 'Solo puedes asignar tareas a tus amigos');
}

// Cambiar los colaboradores es exclusivo del dueño y sólo admite amigos.
async function collaboratorsRejection(
  reply: FastifyReply,
  taskId: string,
  userId: string,
  ids: string[] | undefined,
) {
  if (ids === undefined) return undefined;
  if (!(await isTaskOwner(taskId, userId)))
    return failure(reply, 403, 'Solo el dueño puede cambiar los colaboradores');

  return collaboratorsFailure(reply, ids, userId);
}

// Un espacio solo puede usarse si soy miembro. Sin espacio indicado no hay nada que validar.
async function workspaceFailure(
  reply: FastifyReply,
  workspaceId: string | undefined,
  userId: string,
) {
  if (workspaceId === undefined || (await isWorkspaceMember(workspaceId, userId))) return undefined;

  return failure(reply, 404, 'Espacio no encontrado');
}

// Solo la transición a COMPLETED da XP y racha; reabrir o editar una tarea ya completada no.
function becameCompleted(before: Status, after: Status) {
  return before !== Status.COMPLETED && after === Status.COMPLETED;
}

function collaboratorsUpdate(ids: string[] | undefined) {
  return ids === undefined ? {} : { assignedUsers: { set: ids.map((id) => ({ id })) } };
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

async function withValidReferences<T extends { categoryId?: string; workspaceId?: string }, R>(
  reply: FastifyReply,
  data: T,
  userId: string,
  save: (data: T) => Promise<R>,
) {
  const missing =
    (await categoryFailure(reply, data.categoryId, userId)) ??
    (await workspaceFailure(reply, data.workspaceId, userId));

  return missing ?? save(data);
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

    const { categoryId, completed, workspaceId } = queryResult.data;

    return prisma.task.findMany({
      where: {
        ...visibleTo(getUserId(request)),
        categoryId,
        workspaceId,
        status: toStatusFilter(completed),
      },
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
    const { collaboratorIds = [], ...fields } = bodyResult.data;
    const collaboratorsError = await collaboratorsFailure(reply, collaboratorIds, userId);
    if (collaboratorsError) return collaboratorsError;

    return withValidReferences(reply, fields, userId, async (data) => {
      const task = await prisma.task.create({
        data: {
          ...data,
          userId,
          assignedUsers: { connect: collaboratorIds.map((id) => ({ id })) },
        },
        select: taskSelect,
      });

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

    const { collaboratorIds, ...fields } = bodyResult.data;
    const rejection = await collaboratorsRejection(reply, task.id, userId, collaboratorIds);
    if (rejection) return rejection;

    return withValidReferences(reply, fields, userId, async (data) => {
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { ...data, ...collaboratorsUpdate(collaboratorIds) },
        select: taskSelect,
      });

      if (!becameCompleted(task.status, updated.status)) return updated;

      // Gamificación: el reward va en la misma respuesta para que el frontend muestre el XP y los logros.
      const reward = await recordTaskCompletion(userId, updated);

      return { ...updated, reward };
    });
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
