import { Priority, Status } from '@prisma/client';
import prisma from '../lib/prisma';
import { visibleTo } from '../lib/taskVisibility';

const dayMs = 24 * 60 * 60 * 1000;

// XP base por prioridad, más los bonus por entregar a tiempo y por compartir la tarea con amigos.
export const basePriorityXp: Record<Priority, number> = { HIGH: 50, MEDIUM: 30, LOW: 15 };
export const onTimeBonusXp = 10;
export const collaborativeBonusXp = 15;

export interface CompletedTaskFacts {
  priority: Priority;
  dueDate: Date | null;
  assignedUsers: { id: string }[];
}

// Día del calendario en UTC (índice de días desde 1970). Las fechas límite se guardan a medianoche UTC.
function utcDay(date: Date) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / dayMs);
}

function isOnTime(dueDate: Date | null, now: Date) {
  return dueDate !== null && utcDay(now) <= utcDay(dueDate);
}

export function xpForCompletion(task: CompletedTaskFacts, now: Date) {
  const onTime = isOnTime(task.dueDate, now) ? onTimeBonusXp : 0;
  const collaborative = task.assignedUsers.length > 0 ? collaborativeBonusXp : 0;

  return basePriorityXp[task.priority] + onTime + collaborative;
}

// Nivel = floor(sqrt(xp / 100)) + 1. El nivel L empieza en 100·(L-1)² XP y termina en 100·L².
export function levelForXp(xp: number) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function levelStartXp(level: number) {
  return 100 * (level - 1) ** 2;
}

export function nextLevelXp(level: number) {
  return 100 * level ** 2;
}

// Días completos entre el último día con tarea completada y hoy (null si nunca completó ninguna).
export function daysSince(lastTaskCompletedAt: Date | null, now: Date) {
  return lastTaskCompletedAt === null ? null : utcDay(now) - utcDay(lastTaskCompletedAt);
}

// Racha tras completar una tarea hoy: mismo día la mantiene, día siguiente la suma, más de un día la reinicia.
export function nextStreak(currentStreak: number, days: number | null) {
  if (days === null || days > 1) return 1;

  return days === 1 ? currentStreak + 1 : Math.max(currentStreak, 1);
}

// Racha que se muestra: si pasó más de un día sin completar nada, ya no está activa.
export function activeStreak(
  user: { currentStreak: number; lastTaskCompletedAt: Date | null },
  now: Date,
) {
  const days = daysSince(user.lastTaskCompletedAt, now);

  return days !== null && days <= 1 ? user.currentStreak : 0;
}

export interface GamificationStats {
  completedTasks: number;
  highPriorityTasks: number;
  collaborativeTasks: number;
  longestStreak: number;
  level: number;
}

interface AchievementDefinition {
  title: string;
  description: string;
  isUnlocked: (stats: GamificationStats) => boolean;
}

// Catálogo de logros: cada regla es una comparación sobre las estadísticas, sin cadenas if/else.
export const achievementCatalog = {
  FIRST_TASK: {
    title: 'Primer paso',
    description: 'Completa tu primera tarea.',
    isUnlocked: (stats) => stats.completedTasks >= 1,
  },
  STREAK_3: {
    title: 'En racha',
    description: 'Completa tareas 3 días seguidos.',
    isUnlocked: (stats) => stats.longestStreak >= 3,
  },
  STREAK_7: {
    title: 'Semana imparable',
    description: 'Completa tareas 7 días seguidos.',
    isUnlocked: (stats) => stats.longestStreak >= 7,
  },
  STREAK_30: {
    title: 'Mes de hierro',
    description: 'Completa tareas 30 días seguidos.',
    isUnlocked: (stats) => stats.longestStreak >= 30,
  },
  TEAM_PLAYER: {
    title: 'Jugador de equipo',
    description: 'Completa una tarea compartida con un amigo.',
    isUnlocked: (stats) => stats.collaborativeTasks >= 1,
  },
  HIGH_PRIORITY_10: {
    title: 'Sin miedo a lo urgente',
    description: 'Completa 10 tareas de prioridad alta.',
    isUnlocked: (stats) => stats.highPriorityTasks >= 10,
  },
  LEVEL_5: {
    title: 'Nivel 5',
    description: 'Alcanza el nivel 5.',
    isUnlocked: (stats) => stats.level >= 5,
  },
} satisfies Record<string, AchievementDefinition>;

export type BadgeKey = keyof typeof achievementCatalog;

export const badgeKeys = Object.keys(achievementCatalog) as BadgeKey[];

const progressSelect = {
  xp: true,
  level: true,
  currentStreak: true,
  longestStreak: true,
  lastTaskCompletedAt: true,
} as const;

// Estadísticas de logros sobre las tareas completadas que puedo ver (propias o compartidas conmigo).
async function completionStats(
  userId: string,
  progress: { level: number; longestStreak: number },
): Promise<GamificationStats> {
  const completed = { status: Status.COMPLETED, ...visibleTo(userId) };
  const [completedTasks, highPriorityTasks, collaborativeTasks] = await Promise.all([
    prisma.task.count({ where: completed }),
    prisma.task.count({ where: { ...completed, priority: Priority.HIGH } }),
    prisma.task.count({ where: { ...completed, assignedUsers: { some: {} } } }),
  ]);

  return { completedTasks, highPriorityTasks, collaborativeTasks, ...progress };
}

// Desbloquea los logros cuya regla se cumple y todavía no están. Es idempotente: la restricción única lo garantiza.
export async function unlockAchievements(userId: string, stats: GamificationStats) {
  const owned = await prisma.userAchievement.findMany({
    where: { userId },
    select: { badgeKey: true },
  });
  const ownedKeys = new Set(owned.map((row) => row.badgeKey));
  const newKeys = badgeKeys.filter(
    (key) => !ownedKeys.has(key) && achievementCatalog[key].isUnlocked(stats),
  );

  if (newKeys.length > 0) {
    await prisma.userAchievement.createMany({
      data: newKeys.map((badgeKey) => ({ userId, badgeKey })),
      skipDuplicates: true,
    });
  }

  return newKeys;
}

export interface CompletionReward {
  xpGained: number;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  newAchievements: { key: BadgeKey; title: string }[];
}

// Aplica una tarea recién completada: XP, nivel, racha y logros. Devuelve null si el usuario no existe.
export async function recordTaskCompletion(
  userId: string,
  task: CompletedTaskFacts,
  now: Date = new Date(),
): Promise<CompletionReward | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: progressSelect });
  if (!user) return null;

  const xpGained = xpForCompletion(task, now);
  const xp = user.xp + xpGained;
  const level = levelForXp(xp);
  const currentStreak = nextStreak(user.currentStreak, daysSince(user.lastTaskCompletedAt, now));
  const longestStreak = Math.max(user.longestStreak, currentStreak);

  await prisma.user.update({
    where: { id: userId },
    data: { xp, level, currentStreak, longestStreak, lastTaskCompletedAt: now },
  });

  const unlocked = await unlockAchievements(
    userId,
    await completionStats(userId, { level, longestStreak }),
  );

  return {
    xpGained,
    xp,
    level,
    currentStreak,
    longestStreak,
    newAchievements: unlocked.map((key) => ({ key, title: achievementCatalog[key].title })),
  };
}

// Perfil de gamificación: nivel y XP, racha y el catálogo completo (desbloqueados con fecha, bloqueados con requisito).
export async function getGamificationProfile(userId: string, now: Date = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...progressSelect, achievements: { select: { badgeKey: true, unlockedAt: true } } },
  });
  if (!user) return null;

  const unlockedAt = new Map(user.achievements.map((row) => [row.badgeKey, row.unlockedAt]));

  return {
    xp: user.xp,
    level: user.level,
    levelStartXp: levelStartXp(user.level),
    nextLevelXp: nextLevelXp(user.level),
    currentStreak: activeStreak(user, now),
    longestStreak: user.longestStreak,
    achievements: badgeKeys.map((key) => {
      const date = unlockedAt.get(key);

      return {
        key,
        title: achievementCatalog[key].title,
        description: achievementCatalog[key].description,
        unlocked: date !== undefined,
        unlockedAt: date ? date.toISOString() : null,
      };
    }),
  };
}

// Nivel y racha públicos de un amigo, para mostrarlos junto a su identificador.
export function publicProgress(
  user: { level: number; currentStreak: number; lastTaskCompletedAt: Date | null },
  now: Date = new Date(),
) {
  return { level: user.level, currentStreak: activeStreak(user, now) };
}

export const friendProgressSelect = progressSelect;
