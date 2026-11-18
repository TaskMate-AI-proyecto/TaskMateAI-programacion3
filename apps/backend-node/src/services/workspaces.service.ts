import { WorkspaceRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { acceptedFriendIds } from './friends';

// Espacio compartido: un proyecto con amigos. Solo los miembros pueden verlo y añadir gente.
export const memberRole = WorkspaceRole.MEMBER;
export const ownerRole = WorkspaceRole.OWNER;

export async function isWorkspaceMember(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });

  return membership !== null;
}

// Todos los ids indicados deben ser amigos con solicitud aceptada.
export async function onlyFriends(userId: string, ids: string[]) {
  const friends = await acceptedFriendIds(userId);

  return ids.every((id) => friends.includes(id));
}

export const workspaceSelect = {
  id: true,
  name: true,
  icon: true,
  color: true,
  ownerId: true,
  createdAt: true,
  members: {
    select: { role: true, user: { select: { id: true, uniqueTag: true } } },
    orderBy: { joinedAt: 'asc' as const },
  },
} as const;

export interface WorkspaceRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  ownerId: string;
  createdAt: Date;
  members: { role: WorkspaceRole; user: { id: string; uniqueTag: string } }[];
  tasks?: { id: string }[];
}

// Resumen que consume el frontend: mi rol, si lo comparten conmigo y lo pendiente del espacio.
export function toWorkspaceSummary(row: WorkspaceRow, meId: string) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    ownerId: row.ownerId,
    createdAt: row.createdAt,
    role: row.members.find((member) => member.user.id === meId)?.role ?? null,
    shared: row.ownerId !== meId,
    memberCount: row.members.length,
    pendingTasks: row.tasks?.length ?? 0,
    members: row.members.map((member) => ({
      id: member.user.id,
      uniqueTag: member.user.uniqueTag,
      role: member.role,
    })),
  };
}
