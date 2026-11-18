import { Priority, Status } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  achievementCatalog,
  activeStreak,
  levelForXp,
  nextLevelXp,
  nextStreak,
  unlockAchievements,
  xpForCompletion,
} from '../src/services/gamification.service';
import { authHeaders, createTestApp, testUser } from './helpers';

const prismaMock = vi.hoisted(() => ({
  task: { findFirst: vi.fn(), update: vi.fn(), count: vi.fn() },
  user: { findUnique: vi.fn(), update: vi.fn() },
  userAchievement: { findMany: vi.fn(), createMany: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));
vi.mock('../src/services/email', () => ({ sendVerificationCode: vi.fn() }));

const dayMs = 24 * 60 * 60 * 1000;

describe('reglas de gamificación', () => {
  describe('XP por completar una tarea', () => {
    it('da la base según la prioridad', () => {
      const now = new Date('2026-11-13T12:00:00Z');

      expect(
        xpForCompletion({ priority: Priority.HIGH, dueDate: null, assignedUsers: [] }, now),
      ).toBe(50);
      expect(
        xpForCompletion({ priority: Priority.MEDIUM, dueDate: null, assignedUsers: [] }, now),
      ).toBe(30);
      expect(
        xpForCompletion({ priority: Priority.LOW, dueDate: null, assignedUsers: [] }, now),
      ).toBe(15);
    });

    it('suma el bonus por entregar el mismo día de la fecha límite o antes', () => {
      const dueDate = new Date('2026-11-20T00:00:00Z');

      expect(
        xpForCompletion(
          { priority: Priority.LOW, dueDate, assignedUsers: [] },
          new Date('2026-11-18T09:00:00Z'),
        ),
      ).toBe(25);
      expect(
        xpForCompletion(
          { priority: Priority.LOW, dueDate, assignedUsers: [] },
          new Date('2026-11-20T23:00:00Z'),
        ),
      ).toBe(25);
      expect(
        xpForCompletion(
          { priority: Priority.LOW, dueDate, assignedUsers: [] },
          new Date('2026-11-21T09:00:00Z'),
        ),
      ).toBe(15);
    });

    it('suma el bonus de tarea colaborativa cuando hay amigos asignados', () => {
      const now = new Date('2026-11-13T12:00:00Z');

      expect(
        xpForCompletion(
          { priority: Priority.HIGH, dueDate: null, assignedUsers: [{ id: 'user-2' }] },
          now,
        ),
      ).toBe(65);
    });

    it('acumula todos los bonus', () => {
      const dueDate = new Date('2026-11-20T00:00:00Z');
      const task = { priority: Priority.HIGH, dueDate, assignedUsers: [{ id: 'user-2' }] };

      expect(xpForCompletion(task, new Date('2026-11-18T09:00:00Z'))).toBe(75);
    });
  });

  describe('nivel', () => {
    it('sigue la fórmula floor(sqrt(xp / 100)) + 1', () => {
      expect(levelForXp(0)).toBe(1);
      expect(levelForXp(99)).toBe(1);
      expect(levelForXp(100)).toBe(2);
      expect(levelForXp(399)).toBe(2);
      expect(levelForXp(400)).toBe(3);
      expect(levelForXp(2500)).toBe(6);
    });

    it('calcula el XP del siguiente nivel', () => {
      expect(nextLevelXp(1)).toBe(100);
      expect(nextLevelXp(2)).toBe(400);
      expect(levelForXp(nextLevelXp(2))).toBe(3);
    });
  });

  describe('racha', () => {
    it('empieza en 1 si nunca completó nada', () => {
      expect(nextStreak(0, null)).toBe(1);
    });

    it('mantiene la racha si ya completó hoy', () => {
      expect(nextStreak(3, 0)).toBe(3);
    });

    it('suma 1 si la última tarea fue ayer', () => {
      expect(nextStreak(3, 1)).toBe(4);
    });

    it('reinicia a 1 si pasó más de un día', () => {
      expect(nextStreak(3, 2)).toBe(1);
    });

    it('no muestra como activa una racha que ya se cortó', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * dayMs);
      const yesterday = new Date(now.getTime() - dayMs);

      expect(activeStreak({ currentStreak: 5, lastTaskCompletedAt: threeDaysAgo }, now)).toBe(0);
      expect(activeStreak({ currentStreak: 5, lastTaskCompletedAt: yesterday }, now)).toBe(5);
    });
  });

  describe('logros', () => {
    it('desbloquea solo los logros que se cumplen y aún no están', async () => {
      prismaMock.userAchievement.findMany.mockResolvedValue([{ badgeKey: 'FIRST_TASK' }]);

      const unlocked = await unlockAchievements(testUser.id, {
        completedTasks: 1,
        highPriorityTasks: 0,
        collaborativeTasks: 0,
        longestStreak: 3,
        level: 1,
      });

      expect(unlocked).toEqual(['STREAK_3']);
      expect(prismaMock.userAchievement.createMany).toHaveBeenCalledWith({
        data: [{ userId: testUser.id, badgeKey: 'STREAK_3' }],
        skipDuplicates: true,
      });
    });

    it('no vuelve a escribir si no hay logros nuevos (idempotente)', async () => {
      prismaMock.userAchievement.findMany.mockResolvedValue([{ badgeKey: 'FIRST_TASK' }]);

      const unlocked = await unlockAchievements(testUser.id, {
        completedTasks: 1,
        highPriorityTasks: 0,
        collaborativeTasks: 0,
        longestStreak: 1,
        level: 1,
      });

      expect(unlocked).toEqual([]);
      expect(prismaMock.userAchievement.createMany).not.toHaveBeenCalled();
    });

    it('define los logros del catálogo con título y requisito', () => {
      expect(Object.keys(achievementCatalog)).toEqual(
        expect.arrayContaining([
          'FIRST_TASK',
          'STREAK_3',
          'STREAK_7',
          'STREAK_30',
          'TEAM_PLAYER',
          'HIGH_PRIORITY_10',
          'LEVEL_5',
        ]),
      );
      expect(
        achievementCatalog.LEVEL_5.isUnlocked({
          completedTasks: 0,
          highPriorityTasks: 0,
          collaborativeTasks: 0,
          longestStreak: 0,
          level: 5,
        }),
      ).toBe(true);
    });
  });

  describe('rutas', () => {
    let app: FastifyInstance;
    let headers: ReturnType<typeof authHeaders>;

    beforeAll(async () => {
      app = await createTestApp();
      headers = authHeaders(app);
    });

    afterAll(async () => {
      await app.close();
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('GET /api/gamification/profile exige autenticación', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/gamification/profile' });

      expect(response.statusCode).toBe(401);
    });

    it('GET /api/gamification/profile devuelve XP, nivel, racha y el catálogo con desbloqueados y bloqueados', async () => {
      const unlockedAt = new Date('2026-11-10T10:00:00Z');
      prismaMock.user.findUnique.mockResolvedValue({
        xp: 150,
        level: 2,
        currentStreak: 0,
        longestStreak: 4,
        lastTaskCompletedAt: null,
        achievements: [{ badgeKey: 'FIRST_TASK', unlockedAt }],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/gamification/profile',
        headers,
      });
      const body = response.json();

      expect(response.statusCode).toBe(200);
      expect(body).toMatchObject({
        xp: 150,
        level: 2,
        nextLevelXp: 400,
        currentStreak: 0,
        longestStreak: 4,
      });
      expect(body.achievements).toHaveLength(Object.keys(achievementCatalog).length);
      expect(
        body.achievements.find((item: { key: string }) => item.key === 'FIRST_TASK'),
      ).toMatchObject({
        unlocked: true,
        unlockedAt: unlockedAt.toISOString(),
      });
      expect(
        body.achievements.find((item: { key: string }) => item.key === 'STREAK_3'),
      ).toMatchObject({
        unlocked: false,
        unlockedAt: null,
        description: 'Completa tareas 3 días seguidos.',
      });
    });

    it('PUT completar una tarea devuelve el reward con XP, racha y logros nuevos', async () => {
      const storedTask = {
        id: 'task-1',
        title: 'Estudiar',
        status: Status.PENDING,
        priority: Priority.MEDIUM,
        dueDate: null,
        assignedUsers: [],
      };
      prismaMock.task.findFirst.mockResolvedValue(storedTask);
      prismaMock.task.update.mockResolvedValue({ ...storedTask, status: Status.COMPLETED });
      prismaMock.user.findUnique.mockResolvedValue({
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastTaskCompletedAt: null,
      });
      prismaMock.task.count
        .mockResolvedValueOnce(1) // completadas
        .mockResolvedValueOnce(0) // prioridad alta
        .mockResolvedValueOnce(0); // compartidas
      prismaMock.userAchievement.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/tasks/task-1',
        headers,
        payload: { status: Status.COMPLETED },
      });
      const body = response.json();

      expect(response.statusCode).toBe(200);
      expect(body).toMatchObject({ status: Status.COMPLETED });
      expect(body.reward).toMatchObject({
        xpGained: 30,
        xp: 30,
        level: 1,
        currentStreak: 1,
        longestStreak: 1,
        newAchievements: [{ key: 'FIRST_TASK', title: 'Primer paso' }],
      });
      expect(prismaMock.user.update.mock.calls[0][0].data).toMatchObject({
        xp: 30,
        currentStreak: 1,
      });
    });

    it('PUT sobre una tarea que ya estaba completada no suma XP', async () => {
      const storedTask = {
        id: 'task-1',
        title: 'Estudiar',
        status: Status.COMPLETED,
        priority: Priority.HIGH,
        dueDate: null,
        assignedUsers: [],
      };
      prismaMock.task.findFirst.mockResolvedValue(storedTask);
      prismaMock.task.update.mockResolvedValue({ ...storedTask, title: 'Estudiar más' });

      const response = await app.inject({
        method: 'PUT',
        url: '/api/tasks/task-1',
        headers,
        payload: { title: 'Estudiar más' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().reward).toBeUndefined();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
