import { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { failure, getUserId } from '../lib/http';
import { acceptedFriendIds, areFriends } from '../services/friends';
import { isWorkspaceMember } from '../services/workspaces.service';

export const maxMessageLength = 2000;
const historyLimit = 200;
// Los chats directos sólo existen entre amigos con solicitud aceptada.
const notFriendsMessage = 'Solo puedes escribir a tus amigos';
const recentLimit = 500;

const contentField = z.string().trim().min(1).max(maxMessageLength);
// Mensaje directo a un amigo, o mensaje al canal grupal de un espacio del que soy miembro.
const directSchema = z.object({ receiverId: z.string().min(1), content: contentField });
const groupSendSchema = z.object({ workspaceId: z.string().min(1), content: contentField });
const groupQuerySchema = z.object({ workspaceId: z.string().min(1) });
const userParamsSchema = z.object({ userId: z.string().min(1) });

interface MessageRow {
  senderId: string;
  receiverId: string | null;
  content: string;
  createdAt: Date;
}

// Mensajes en orden descendente: el primero que aparece por contacto es el más reciente.
// Los mensajes grupales no tienen receptor y no cuentan como contacto.
function latestByContact(messages: MessageRow[], meId: string) {
  const latest = new Map<string, MessageRow>();

  for (const message of messages) {
    const otherId = message.senderId === meId ? message.receiverId : message.senderId;
    if (otherId && !latest.has(otherId)) latest.set(otherId, message);
  }

  return latest;
}

function activityTime(lastMessageAt: Date | undefined) {
  return lastMessageAt ? lastMessageAt.getTime() : 0;
}

// Mensajes entre dos usuarios, en cualquier dirección.
function conversationWhere(meId: string, otherId: string) {
  return {
    OR: [
      { senderId: meId, receiverId: otherId },
      { senderId: otherId, receiverId: meId },
    ],
  };
}

async function sendDirect(reply: FastifyReply, meId: string, receiverId: string, content: string) {
  if (receiverId === meId) return failure(reply, 400, 'No puedes enviarte mensajes a ti mismo');

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });
  if (!receiver) return failure(reply, 404, 'Destinatario no encontrado');
  if (!(await areFriends(meId, receiver.id))) return failure(reply, 403, notFriendsMessage);

  reply.status(201);
  return prisma.message.create({
    data: { senderId: meId, receiverId: receiver.id, content },
  });
}

async function sendGroup(reply: FastifyReply, meId: string, workspaceId: string, content: string) {
  if (!(await isWorkspaceMember(workspaceId, meId)))
    return failure(reply, 404, 'Espacio no encontrado');

  reply.status(201);
  return prisma.message.create({ data: { senderId: meId, workspaceId, content } });
}

export default async function messageRoutes(app: FastifyInstance) {
  // Otros usuarios con el último mensaje y el número de mensajes que aún no he leído.
  app.get('/api/messages/contacts', { preHandler: app.authenticate }, async (request) => {
    const meId = getUserId(request);
    const friendIds = await acceptedFriendIds(meId);
    const [users, unread, recent] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: friendIds } },
        select: { id: true, email: true, uniqueTag: true },
        orderBy: { email: 'asc' },
        take: 200,
      }),
      prisma.message.groupBy({
        by: ['senderId'],
        where: { receiverId: meId, readAt: null },
        _count: { _all: true },
      }),
      prisma.message.findMany({
        where: { workspaceId: null, OR: [{ senderId: meId }, { receiverId: meId }] },
        orderBy: { createdAt: 'desc' },
        take: recentLimit,
      }),
    ]);

    const unreadBySender = new Map(unread.map((row) => [row.senderId, row._count._all]));
    const latest = latestByContact(recent, meId);

    return users
      .map((user) => {
        const last = latest.get(user.id);

        return {
          ...user,
          unreadCount: unreadBySender.get(user.id) ?? 0,
          lastMessage: last
            ? { content: last.content, createdAt: last.createdAt, fromMe: last.senderId === meId }
            : null,
        };
      })
      .sort(
        (a, b) =>
          activityTime(b.lastMessage?.createdAt) - activityTime(a.lastMessage?.createdAt) ||
          a.email.localeCompare(b.email),
      );
  });

  // Canal grupal de un espacio, del más antiguo al más reciente. Solo para miembros.
  app.get('/api/messages', { preHandler: app.authenticate }, async (request, reply) => {
    const query = groupQuerySchema.safeParse(request.query);
    if (!query.success) return failure(reply, 400, 'Indica el espacio del canal');

    const { workspaceId } = query.data;
    if (!(await isWorkspaceMember(workspaceId, getUserId(request))))
      return failure(reply, 404, 'Espacio no encontrado');

    const messages = await prisma.message.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: historyLimit,
      include: { sender: { select: { id: true, uniqueTag: true } } },
    });

    return messages.reverse();
  });

  // Historial de la conversación con un usuario, del más antiguo al más reciente.
  app.get('/api/messages/:userId', { preHandler: app.authenticate }, async (request, reply) => {
    const params = userParamsSchema.safeParse(request.params);
    if (!params.success) return failure(reply, 400, 'Usuario inválido');

    const meId = getUserId(request);
    const other = await prisma.user.findUnique({
      where: { id: params.data.userId },
      select: { id: true },
    });
    if (!other) return failure(reply, 404, 'Usuario no encontrado');
    if (!(await areFriends(meId, other.id))) return failure(reply, 403, notFriendsMessage);

    const messages = await prisma.message.findMany({
      where: conversationWhere(meId, other.id),
      orderBy: { createdAt: 'desc' },
      take: historyLimit,
    });

    return messages.reverse();
  });

  // Envía un mensaje directo (receiverId) o al canal grupal de un espacio (workspaceId).
  app.post('/api/messages', { preHandler: app.authenticate }, async (request, reply) => {
    const meId = getUserId(request);

    const direct = directSchema.safeParse(request.body);
    if (direct.success) return sendDirect(reply, meId, direct.data.receiverId, direct.data.content);

    const group = groupSendSchema.safeParse(request.body);
    if (group.success) return sendGroup(reply, meId, group.data.workspaceId, group.data.content);

    return failure(reply, 400, 'Mensaje inválido');
  });

  // Marca como leídos los mensajes que ese usuario me envió y que aún no había leído.
  app.patch(
    '/api/messages/:userId/read',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = userParamsSchema.safeParse(request.params);
      if (!params.success) return failure(reply, 400, 'Usuario inválido');

      const result = await prisma.message.updateMany({
        where: { senderId: params.data.userId, receiverId: getUserId(request), readAt: null },
        data: { readAt: new Date() },
      });

      return { success: true, updated: result.count };
    },
  );
}
