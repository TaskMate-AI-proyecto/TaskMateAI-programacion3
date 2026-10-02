import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { categoryResponse, errorResponse, protectedRoute } from '../docs/openapi';
import prisma from '../lib/prisma';

const categoryIdSchema = z.object({ id: z.string().min(1) });
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser hexadecimal');
const createCategorySchema = z.object({
  name: z.string().trim().min(1),
  color: colorSchema.optional(),
});
const updateCategorySchema = createCategorySchema.partial().refine(
  (data) => data.name !== undefined || data.color !== undefined,
  'Debe enviar al menos un campo para actualizar',
);

type JwtUser = {
  id: string;
  email: string;
};

export default async function categoryRoutes(app: FastifyInstance) {
  app.get('/api/categories', { preHandler: app.authenticate, schema: protectedRoute('Categories', 'Lista las categorías del usuario', { response: { 200: { type: 'array', items: categoryResponse }, 401: errorResponse } }) }, async (request) => {
    const { id: userId } = request.user as JwtUser;

    return prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true, color: true },
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post('/api/categories', {
    preHandler: app.authenticate,
    schema: protectedRoute('Categories', 'Crea una categoría', {
      body: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' } } },
      response: { 201: categoryResponse, 400: errorResponse, 401: errorResponse },
    }),
  }, async (request, reply) => {
    const parseResult = createCategorySchema.safeParse(request.body);

    if (!parseResult.success) {
      reply.status(400);
      return { success: false, message: 'Datos de categoría inválidos' };
    }

    const { id: userId } = request.user as JwtUser;
    const category = await prisma.category.create({
      data: { ...parseResult.data, userId },
      select: { id: true, name: true, color: true },
    });

    reply.status(201);
    return category;
  });

  app.put('/api/categories/:id', {
    preHandler: app.authenticate,
    schema: protectedRoute('Categories', 'Actualiza una categoría propia', {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      body: { type: 'object', minProperties: 1, properties: { name: { type: 'string' }, color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' } } },
      response: { 200: categoryResponse, 400: errorResponse, 401: errorResponse, 404: errorResponse },
    }),
  }, async (request, reply) => {
    const paramsResult = categoryIdSchema.safeParse(request.params);
    const bodyResult = updateCategorySchema.safeParse(request.body);

    if (!paramsResult.success || !bodyResult.success) {
      reply.status(400);
      return { success: false, message: 'Datos de categoría inválidos' };
    }

    const { id: userId } = request.user as JwtUser;
    const category = await prisma.category.updateMany({
      where: { id: paramsResult.data.id, userId },
      data: bodyResult.data,
    });

    if (category.count === 0) {
      reply.status(404);
      return { success: false, message: 'Categoría no encontrada' };
    }

    return prisma.category.findFirst({
      where: { id: paramsResult.data.id, userId },
      select: { id: true, name: true, color: true },
    });
  });

  app.delete('/api/categories/:id', {
    preHandler: app.authenticate,
    schema: protectedRoute('Categories', 'Elimina una categoría propia', {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }, 400: errorResponse, 401: errorResponse, 404: errorResponse },
    }),
  }, async (request, reply) => {
    const paramsResult = categoryIdSchema.safeParse(request.params);

    if (!paramsResult.success) {
      reply.status(400);
      return { success: false, message: 'Id de categoría inválido' };
    }

    const { id: userId } = request.user as JwtUser;
    const category = await prisma.category.deleteMany({
      where: { id: paramsResult.data.id, userId },
    });

    if (category.count === 0) {
      reply.status(404);
      return { success: false, message: 'Categoría no encontrada' };
    }

    return { success: true, message: 'Categoría eliminada con éxito' };
  });
}