import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGamificationStore } from '../stores/gamification'
import { useToastStore } from '../stores/toast'
import type { TaskWithReward } from '../types/api'
import { useRewardNotifier } from './useRewardNotifier'

const completed: TaskWithReward = {
  id: 'task-1',
  title: 'Estudiar',
  description: null,
  status: 'COMPLETED',
  priority: 'HIGH',
  dueDate: null,
  categoryId: null,
  category: null,
  reward: {
    xpGained: 50,
    xp: 50,
    level: 1,
    currentStreak: 1,
    longestStreak: 1,
    newAchievements: [{ key: 'FIRST_TASK', title: 'Primer paso' }],
  },
}

describe('useRewardNotifier', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('muestra el XP ganado y el logro nuevo, y actualiza el perfil', () => {
    const gamification = useGamificationStore()
    gamification.profile = {
      xp: 0,
      level: 1,
      levelStartXp: 0,
      nextLevelXp: 100,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [{ key: 'FIRST_TASK', title: 'Primer paso', description: 'Completa tu primera tarea.', unlocked: false, unlockedAt: null }],
    }
    const toast = useToastStore()

    useRewardNotifier()(completed)

    expect(toast.toasts.map((item) => [item.message, item.kind])).toEqual([
      ['+50 XP', 'reward'],
      ['¡Nuevo logro desbloqueado! Primer paso', 'achievement'],
    ])
    expect(gamification.profile).toMatchObject({ xp: 50, currentStreak: 1 })
    expect(gamification.profile?.achievements[0].unlocked).toBe(true)
  })

  it('no hace nada si la tarea no trae recompensa', () => {
    const toast = useToastStore()

    useRewardNotifier()({ ...completed, reward: null })

    expect(toast.toasts).toHaveLength(0)
  })
})
