import { FriendshipStatus } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { failure, getUserId } from '../lib/http';
import prisma from '../lib/prisma';
import { expireStaleFriendRequests, userSummarySelect } from '../services/friends';

const searchSchema = z.object({ tag: z.string().trim().min(2).max(40) });
const maxSearchResults = 10;

type Relation = 'none' | 'friend' | 'outgoing' | 'incoming';

type FriendshipRow = { senderId: string; receiverId: string; status: FriendshipStatus };

function relationEntry(row: FriendshipRow, meId: string): [string, Relation] {
  const otherId = row.senderId === meId ? row.receiverId : row.senderId;
  if (row.status === FriendshipStatus.ACCEPTED) return [otherId, 'friend'];

  return [otherId, row.senderId === meId ? 'outgoing' : 'incoming'];
}

// Relación de mi cuenta con cada usuario encontrado: para no ofrecer enviar solicitudes repetidas.
async function relationsFor(meId: string, userIds: string[]) {
  const rows = await prisma.friendship.findMany({
    where: {
      status: { in: [FriendshipStatus.PENDING, FriendshipStatus.ACCEPTED] },
      OR: [
        { senderId: meId, receiverId: { in: userIds } },
        { senderId: { in: userIds }, receiverId: meId },
      ],
    },
    select: { senderId: true, receiverId: true, status: true },
  });

  return new Map<string, Relation>(rows.map((row) => relationEntry(row, meId)));
}

export default async function userRoutes(app: FastifyInstance) {
  app.get('/api/users/me', { preHandler: app.authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: getUserId(request) },
      select: userSummarySelect,
    });

    return user ?? failure(reply, 404, 'Usuario no encontrado');
  });

  // Busca por identificador exacto o parcial. No devuelve el correo: sólo el identificador público.
  app.get('/api/users/search', { preHandler: app.authenticate }, async (request, reply) => {
    const query = searchSchema.safeParse(request.query);
    if (!query.success)
      return failure(reply, 400, 'Escribe al menos 2 caracteres del identificador');

    await expireStaleFriendRequests();
    const meId = getUserId(request);
    const users = await prisma.user.findMany({
      where: { uniqueTag: { contains: query.data.tag, mode: 'insensitive' }, id: { not: meId } },
      select: { id: true, uniqueTag: true },
      orderBy: { uniqueTag: 'asc' },
      take: maxSearchResults,
    });
    const relations = await relationsFor(
      meId,
      users.map((user) => user.id),
    );

    return users.map((user) => ({ ...user, relation: relations.get(user.id) ?? 'none' }));
  });
}
