import { Status } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { failure, getUserId } from '../lib/http';
import prisma from '../lib/prisma';
import {
  isWorkspaceMember,
  memberRole,
  onlyFriends,
  ownerRole,
  toWorkspaceSummary,
  workspaceSelect,
  WorkspaceRow,
} from '../services/workspaces.service';

const notFriendsMessage = 'Solo puedes añadir a tus amigos';
const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  icon: z.string().trim().min(1).max(30).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  memberIds: z.array(z.string().min(1)).max(20).default([]),
});
const membersSchema = z.object({ memberIds: z.array(z.string().min(1)).min(1).max(20) });
const idSchema = z.object({ id: z.string().min(1) });

export default async function workspaceRoutes(app: FastifyInstance) {
  // Espacios en los que soy miembro (propios y compartidos), con miembros y tareas pendientes.
  app.get('/api/workspaces', { preHandler: app.authenticate }, async (request) => {
    const meId = getUserId(request);
    const rows: WorkspaceRow[] = await prisma.workspace.findMany({
      where: { members: { some: { userId: meId } } },
      select: {
        ...workspaceSelect,
        tasks: { where: { status: { not: Status.COMPLETED } }, select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => toWorkspaceSummary(row, meId));
  });

  // Crea el espacio con el usuario como dueño e invita a los amigos indicados.
  app.post('/api/workspaces', { preHandler: app.authenticate }, async (request, reply) => {
    const body = createSchema.safeParse(request.body);
    if (!body.success) return failure(reply, 400, 'Datos de espacio inválidos');

    const meId = getUserId(request);
    const { memberIds, ...fields } = body.data;
    if (!(await onlyFriends(meId, memberIds))) return failure(reply, 400, notFriendsMessage);

    const workspace: WorkspaceRow = await prisma.workspace.create({
      data: {
        ...fields,
        ownerId: meId,
        members: {
          create: [
            { userId: meId, role: ownerRole },
            ...memberIds.map((userId) => ({ userId, role: memberRole })),
          ],
        },
      },
      select: workspaceSelect,
    });

    reply.status(201);
    return toWorkspaceSummary(workspace, meId);
  });

  // Añade amigos a un espacio del que ya soy miembro. Los que ya estaban se ignoran.
  app.post(
    '/api/workspaces/:id/members',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = idSchema.safeParse(request.params);
      const body = membersSchema.safeParse(request.body);
      if (!params.success || !body.success) return failure(reply, 400, 'Datos inválidos');

      const meId = getUserId(request);
      const workspaceId = params.data.id;
      if (!(await isWorkspaceMember(workspaceId, meId)))
        return failure(reply, 404, 'Espacio no encontrado');
      if (!(await onlyFriends(meId, body.data.memberIds)))
        return failure(reply, 400, notFriendsMessage);

      const result = await prisma.workspaceMember.createMany({
        data: body.data.memberIds.map((userId) => ({ workspaceId, userId, role: memberRole })),
        skipDuplicates: true,
      });

      return { success: true, added: result.count };
    },
  );
}
