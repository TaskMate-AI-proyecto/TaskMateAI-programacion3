import { Friendship, FriendshipStatus } from '@prisma/client';
import { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { failure, getUserId } from '../lib/http';
import prisma from '../lib/prisma';
import { friendProgressSelect, publicProgress } from '../services/gamification.service';
import {
  daysUntil,
  expireStaleFriendRequests,
  findFriendship,
  requestExpiresAt,
  userSummarySelect,
} from '../services/friends';

const requestSchema = z.object({ uniqueTag: z.string().trim().min(2).max(40) });
const respondSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['accept', 'reject']),
});

type Problem = { status: number; message: string };

// Motivo por el que no se puede enviar una solicitud: ya somos amigos o hay una pendiente.
function blockReason(existing: Friendship | null, meId: string): string | undefined {
  if (!existing) return undefined;
  if (existing.status === FriendshipStatus.ACCEPTED) return 'Ya sois amigos';
  if (existing.status !== FriendshipStatus.PENDING) return undefined;

  return existing.senderId === meId
    ? 'Ya enviaste una solicitud a esta persona'
    : 'Esta persona ya te envió una solicitud. Acéptala desde Amigos';
}

// Una solicitud rechazada o caducada se reutiliza: vuelve a estar PENDING, con este remitente y plazo nuevo.
function saveRequest(existing: Friendship | null, meId: string, targetId: string) {
  const data = {
    senderId: meId,
    receiverId: targetId,
    status: FriendshipStatus.PENDING,
    createdAt: new Date(),
  };

  return existing
    ? prisma.friendship.update({ where: { id: existing.id }, data })
    : prisma.friendship.create({ data });
}

// Solicitud que sólo puede responder el destinatario y que sigue pendiente.
function answerProblem(friendship: Friendship | null, meId: string): Problem | undefined {
  if (!friendship || friendship.receiverId !== meId)
    return { status: 404, message: 'Solicitud no encontrada' };
  if (friendship.status === FriendshipStatus.EXPIRED)
    return { status: 410, message: 'La solicitud ha expirado' };
  if (friendship.status !== FriendshipStatus.PENDING)
    return { status: 409, message: 'La solicitud ya fue respondida' };

  return undefined;
}

// Envía la solicitud o explica por qué no se puede. Devuelve la fila guardada o un error.
async function sendRequest(reply: FastifyReply, meId: string, uniqueTag: string) {
  const target = await prisma.user.findUnique({ where: { uniqueTag }, select: userSummarySelect });
  if (!target) return failure(reply, 404, 'No encontramos a nadie con ese identificador');
  if (target.id === meId) return failure(reply, 400, 'No puedes agregarte a ti mismo');

  const existing = await findFriendship(meId, target.id);
  const blocked = blockReason(existing, meId);
  if (blocked) return failure(reply, 409, blocked);

  reply.status(201);
  return saveRequest(existing, meId, target.id);
}

export default async function friendRoutes(app: FastifyInstance) {
  // Cada amigo incluye su nivel y su racha actual, para mostrarlos junto a su identificador.
  app.get('/api/friends', { preHandler: app.authenticate }, async (request) => {
    await expireStaleFriendRequests();
    const meId = getUserId(request);
    const now = new Date();
    const friendSelect = { ...userSummarySelect, ...friendProgressSelect };
    const rows = await prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ senderId: meId }, { receiverId: meId }],
      },
      include: {
        sender: { select: friendSelect },
        receiver: { select: friendSelect },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => {
      const friend = row.senderId === meId ? row.receiver : row.sender;

      return {
        friendshipId: row.id,
        friend: {
          id: friend.id,
          email: friend.email,
          uniqueTag: friend.uniqueTag,
          ...publicProgress(friend, now),
        },
        since: row.updatedAt,
      };
    });
  });

  // Solicitudes activas (no caducadas) en ambas direcciones, con los días que les quedan.
  app.get('/api/friends/requests', { preHandler: app.authenticate }, async (request) => {
    await expireStaleFriendRequests();
    const meId = getUserId(request);
    const now = new Date();
    const rows = await prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.PENDING,
        OR: [{ senderId: meId }, { receiverId: meId }],
      },
      include: {
        sender: { select: userSummarySelect },
        receiver: { select: userSummarySelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => {
      const incoming = row.receiverId === meId;
      const expiresAt = requestExpiresAt(row.createdAt);

      return {
        id: row.id,
        direction: incoming ? 'incoming' : 'outgoing',
        user: incoming ? row.sender : row.receiver,
        createdAt: row.createdAt,
        expiresAt,
        daysLeft: daysUntil(expiresAt, now),
      };
    });
  });

  app.post('/api/friends/request', { preHandler: app.authenticate }, async (request, reply) => {
    const body = requestSchema.safeParse(request.body);
    if (!body.success) return failure(reply, 400, 'Identificador inválido');

    await expireStaleFriendRequests();

    return sendRequest(reply, getUserId(request), body.data.uniqueTag);
  });

  app.post('/api/friends/respond', { preHandler: app.authenticate }, async (request, reply) => {
    const body = respondSchema.safeParse(request.body);
    if (!body.success) return failure(reply, 400, 'Respuesta inválida');

    await expireStaleFriendRequests();
    const friendship = await prisma.friendship.findUnique({ where: { id: body.data.requestId } });
    if (!friendship) return failure(reply, 404, 'Solicitud no encontrada');

    const problem = answerProblem(friendship, getUserId(request));
    if (problem) return failure(reply, problem.status, problem.message);

    const status =
      body.data.action === 'accept' ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED;

    return prisma.friendship.update({ where: { id: friendship.id }, data: { status } });
  });
}
