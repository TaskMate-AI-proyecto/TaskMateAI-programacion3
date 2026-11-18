import { FriendshipStatus } from '@prisma/client';
import prisma from '../lib/prisma';

// Una solicitud pendiente caduca a los 30 días desde su creación.
export const friendRequestTtlDays = 30;
const dayMs = 24 * 60 * 60 * 1000;

export const userSummarySelect = { id: true, email: true, uniqueTag: true } as const;

function expiryCutoff(now: Date) {
  return new Date(now.getTime() - friendRequestTtlDays * dayMs);
}

export function requestExpiresAt(createdAt: Date) {
  return new Date(createdAt.getTime() + friendRequestTtlDays * dayMs);
}

// Días que faltan para que una solicitud caduque (0 si ya caducó).
export function daysUntil(date: Date, now: Date = new Date()) {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / dayMs));
}

// Descarta las solicitudes PENDING de más de 30 días: pasan a EXPIRED. Se ejecuta antes de leer amistades.
export function expireStaleFriendRequests(now: Date = new Date()) {
  return prisma.friendship.updateMany({
    where: { status: FriendshipStatus.PENDING, createdAt: { lt: expiryCutoff(now) } },
    data: { status: FriendshipStatus.EXPIRED },
  });
}

// Solo puede haber una fila por pareja de usuarios, en cualquier dirección.
export function findFriendship(userId: string, otherId: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ],
    },
  });
}

// Ids de los amigos con amistad aceptada: la base de los chats y de las tareas colaborativas.
export async function acceptedFriendIds(userId: string) {
  const rows = await prisma.friendship.findMany({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });

  return rows.map((row) => (row.senderId === userId ? row.receiverId : row.senderId));
}

export async function areFriends(userId: string, otherId: string) {
  const friendship = await findFriendship(userId, otherId);

  return friendship?.status === FriendshipStatus.ACCEPTED;
}
