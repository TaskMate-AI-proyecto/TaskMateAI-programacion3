import { describe, expect, it } from 'vitest'
import type { GamificationProfile } from '../types/api'
import { applyReward, levelProgressPercent, levelStartXp, nextLevelXp, rewardMessages } from './gamification'

const profile: GamificationProfile = {
  xp: 150,
  level: 2,
  levelStartXp: 100,
  nextLevelXp: 400,
  currentStreak: 1,
  longestStreak: 1,
  achievements: [
    { key: 'FIRST_TASK', title: 'Primer paso', description: 'Completa tu primera tarea.', unlocked: true, unlockedAt: '2026-11-10T10:00:00.000Z' },
    { key: 'STREAK_3', title: 'En racha', description: 'Completa tareas 3 días seguidos.', unlocked: false, unlockedAt: null },
  ],
}

describe('utils de gamificación', () => {
  it('calcula el inicio y el fin de cada nivel con la fórmula del backend', () => {
    expect(levelStartXp(1)).toBe(0)
    expect(levelStartXp(2)).toBe(100)
    expect(nextLevelXp(2)).toBe(400)
  })

  it('calcula el porcentaje recorrido del nivel actual y lo acota entre 0 y 100', () => {
    expect(levelProgressPercent(profile)).toBeCloseTo(16.67, 1)
    expect(levelProgressPercent({ xp: 999, level: 1 })).toBe(100)
    expect(levelProgressPercent({ xp: 0, level: 2 })).toBe(0)
  })

  it('aplica una recompensa al perfil y marca los logros nuevos como desbloqueados', () => {
    const updated = applyReward(profile, {
      xpGained: 50,
      xp: 200,
      level: 2,
      currentStreak: 3,
      longestStreak: 3,
      newAchievements: [{ key: 'STREAK_3', title: 'En racha' }],
    })

    expect(updated).toMatchObject({ xp: 200, level: 2, currentStreak: 3, longestStreak: 3 })
    expect(updated.achievements[1]).toMatchObject({ key: 'STREAK_3', unlocked: true })
    expect(updated.achievements[1].unlockedAt).not.toBeNull()
    expect(updated.achievements[0]).toBe(profile.achievements[0])
  })

  it('arma los mensajes del toast: el XP y un aviso por cada logro nuevo', () => {
    expect(
      rewardMessages({
        xpGained: 50,
        xp: 50,
        level: 1,
        currentStreak: 1,
        longestStreak: 1,
        newAchievements: [{ key: 'FIRST_TASK', title: 'Primer paso' }],
      }),
    ).toEqual(['+50 XP', '¡Nuevo logro desbloqueado! Primer paso'])
  })
})
