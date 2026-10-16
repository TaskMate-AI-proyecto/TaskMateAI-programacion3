import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { failure, getUserId } from '../lib/http';

const categoryIdSchema = z.object({ id: z.string().min(1) });
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser hexadecimal');
const createCategorySchema = z.object({
  name: z.string().trim().min(1),
  color: colorSchema.optional(),
});
const updateCategorySchema = createCategorySchema
  .partial()
  .refine(
    (data) => data.name !== undefined || data.color !== undefined,
    'Debe enviar al menos un campo para actualizar',
  );

const categorySelect = { id: true, name: true, color: true } as const;

export default async function categoryRoutes(app: FastifyInstance) {
  app.get('/api/categories', { preHandler: app.authenticate }, async (request) => {
    return prisma.category.findMany({
      where: { userId: getUserId(request) },
      select: categorySelect,
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post('/api/categories', { preHandler: app.authenticate }, async (request, reply) => {
    const parseResult = createCategorySchema.safeParse(request.body);

    if (!parseResult.success) return failure(reply, 400, 'Datos de categoría inválidos');

    const category = await prisma.category.create({
      data: { ...parseResult.data, userId: getUserId(request) },
      select: categorySelect,
    });

    reply.status(201);
    return category;
  });

  app.put('/api/categories/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const paramsResult = categoryIdSchema.safeParse(request.params);
    const bodyResult = updateCategorySchema.safeParse(request.body);

    if (!paramsResult.success || !bodyResult.success)
      return failure(reply, 400, 'Datos de categoría inválidos');

    const userId = getUserId(request);
    const category = await prisma.category.updateMany({
      where: { id: paramsResult.data.id, userId },
      data: bodyResult.data,
    });

    if (category.count === 0) return failure(reply, 404, 'Categoría no encontrada');

    return prisma.category.findFirst({
      where: { id: paramsResult.data.id, userId },
      select: categorySelect,
    });
  });

  app.delete('/api/categories/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const paramsResult = categoryIdSchema.safeParse(request.params);

    if (!paramsResult.success) return failure(reply, 400, 'Id de categoría inválido');

    const category = await prisma.category.deleteMany({
      where: { id: paramsResult.data.id, userId: getUserId(request) },
    });

    if (category.count === 0) return failure(reply, 404, 'Categoría no encontrada');

    return { success: true, message: 'Categoría eliminada con éxito' };
  });
}
