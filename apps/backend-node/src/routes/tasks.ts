import { Priority, Status } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { errorResponse, protectedRoute, taskResponse } from '../docs/openapi';
import prisma from '../lib/prisma';

const taskIdSchema = z.object({ id: z.string().min(1) });
const taskDataSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(Status).optional(),
  categoryId: z.string().min(1).optional(),
});
const updateTaskSchema = taskDataSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'Debe enviar al menos un campo para actualizar',
);
const taskQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  completed: z.enum(['true', 'false']).optional(),
});

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  categoryId: true,
  category: { select: { id: true, name: true, color: true } },
} as const;

type JwtUser = {
  id: string;
  email: string;
};

async function findUserCategory(categoryId: string, userId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
}

export default async function taskRoutes(app: FastifyInstance) {
  app.get('/api/tasks', {
    preHandler: app.authenticate,
    schema: protectedRoute('Tasks', 'Lista las tareas del usuario con filtros opcionales', {
      querystring: { type: 'object', properties: { categoryId: { type: 'string' }, completed: { type: 'string', enum: ['true', 'false'] } } },
      response: { 200: { type: 'array', items: taskResponse }, 400: errorResponse, 401: errorResponse },
    }),
  }, async (request, reply) => {
    const queryResult = taskQuerySchema.safeParse(request.query);

    if (!queryResult.success) {
      reply.status(400);
      return { success: false, message: 'Filtros de tareas inválidos' };
    }

    const { id: userId } = request.user as JwtUser;
    const { categoryId, completed } = queryResult.data;
    const status = completed === undefined ? undefined : completed === 'true' ? Status.COMPLETED : { not: Status.COMPLETED };

    return prisma.task.findMany({
      where: { userId, categoryId, status },
      select: taskSelect,
      orderBy: { createdAt: 'asc' },
    });
  });

  app.get('/api/tasks/:id', {
    preHandler: app.authenticate,
    schema: protectedRoute('Tasks', 'Obtiene una tarea propia por ID', {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      response: { 200: taskResponse, 400: errorResponse, 401: errorResponse, 404: errorResponse },
    }),
  }, async (request, reply) => {
    const paramsResult = taskIdSchema.safeParse(request.params);

    if (!paramsResult.success) {
      reply.status(400);
      return { success: false, message: 'Id de tarea inválido' };
    }

    const { id: userId } = request.user as JwtUser;
    const task = await prisma.task.findFirst({
      where: { id: paramsResult.data.id, userId },
      select: taskSelect,
    });

    if (!task) {
      reply.status(404);
      return { success: false, message: 'Tarea no encontrada' };
    }

    return task;
  });

  app.post('/api/tasks', {
    preHandler: app.authenticate,
    schema: protectedRoute('Tasks', 'Crea una tarea y la vincula opcionalmente a una categoría', {
      body: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, description: { type: 'string' }, dueDate: { type: 'string', format: 'date-time' }, priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }, status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }, categoryId: { type: 'string' } } },
      response: { 201: taskResponse, 400: errorResponse, 401: errorResponse, 404: errorResponse },
    }),
  }, async (request, reply) => {
    const bodyResult = taskDataSchema.safeParse(request.body);

    if (!bodyResult.success) {
      reply.status(400);
      return { success: false, message: 'Datos de tarea inválidos' };
    }

    const { id: userId } = request.user as JwtUser;
    const { categoryId, ...taskData } = bodyResult.data;

    if (categoryId && !(await findUserCategory(categoryId, userId))) {
      reply.status(404);
      return { success: false, message: 'Categoría no encontrada' };
    }

    const task = await prisma.task.create({
      data: { ...taskData, categoryId, userId },
      select: taskSelect,
    });

    reply.status(201);
    return task;
  });

  app.put('/api/tasks/:id', {
    preHandler: app.authenticate,
    schema: protectedRoute('Tasks', 'Actualiza una tarea propia', {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      body: { type: 'object', minProperties: 1, properties: { title: { type: 'string' }, description: { type: 'string' }, dueDate: { type: 'string', format: 'date-time' }, priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }, status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }, categoryId: { type: 'string' } } },
      response: { 200: taskResponse, 400: errorResponse, 401: errorResponse, 404: errorResponse },
    }),
  }, async (request, reply) => {
    const paramsResult = taskIdSchema.safeParse(request.params);
    const bodyResult = updateTaskSchema.safeParse(request.body);

    if (!paramsResult.success || !bodyResult.success) {
      reply.status(400);
      return { success: false, message: 'Datos de tarea inválidos' };
    }

    const { id: userId } = request.user as JwtUser;
    const task = await prisma.task.findFirst({
      where: { id: paramsResult.data.id, userId },
      select: { id: true },
    });

    if (!task) {
      reply.status(404);
      return { success: false, message: 'Tarea no encontrada' };
    }

    const { categoryId, ...taskData } = bodyResult.data;

    if (categoryId && !(await findUserCategory(categoryId, userId))) {
      reply.status(404);
      return { success: false, message: 'Categoría no encontrada' };
    }

    return prisma.task.update({
      where: { id: task.id },
      data: { ...taskData, ...(categoryId === undefined ? {} : { categoryId }) },
      select: taskSelect,
    });
  });

  app.delete('/api/tasks/:id', {
    preHandler: app.authenticate,
    schema: protectedRoute('Tasks', 'Elimina una tarea propia', {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }, 400: errorResponse, 401: errorResponse, 404: errorResponse },
    }),
  }, async (request, reply) => {
    const paramsResult = taskIdSchema.safeParse(request.params);

    if (!paramsResult.success) {
      reply.status(400);
      return { success: false, message: 'Id de tarea inválido' };
    }

    const { id: userId } = request.user as JwtUser;
    const deletedTask = await prisma.task.deleteMany({
      where: { id: paramsResult.data.id, userId },
    });

    if (deletedTask.count === 0) {
      reply.status(404);
      return { success: false, message: 'Tarea no encontrada' };
    }

    return { success: true, message: 'Tarea eliminada con éxito' };
  });
}