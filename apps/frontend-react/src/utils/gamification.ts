import type { CompletionReward, GamificationProfile } from '../types/api'

// Espejo de las fórmulas del backend (gamification.service.ts): el nivel L empieza en 100·(L-1)² XP.
export function levelStartXp(level: number) {
  return 100 * (level - 1) ** 2
}

export function nextLevelXp(level: number) {
  return 100 * level ** 2
}

// Porcentaje del nivel actual ya recorrido (0–100), para la barra de progreso.
export function levelProgressPercent(profile: Pick<GamificationProfile, 'xp' | 'level'>) {
  const start = levelStartXp(profile.level)
  const span = nextLevelXp(profile.level) - start
  const ratio = (profile.xp - start) / span

  return Math.min(100, Math.max(0, ratio * 100))
}

// Actualiza el perfil con la recompensa de una tarea completada, sin volver a pedirlo a la API.
export function applyReward(profile: GamificationProfile, reward: CompletionReward): GamificationProfile {
  const unlocked = new Set(reward.newAchievements.map((item) => item.key))
  const unlockedAt = new Date().toISOString()

  return {
    ...profile,
    xp: reward.xp,
    level: reward.level,
    levelStartXp: levelStartXp(reward.level),
    nextLevelXp: nextLevelXp(reward.level),
    currentStreak: reward.currentStreak,
    longestStreak: reward.longestStreak,
    achievements: profile.achievements.map((item) =>
      unlocked.has(item.key) ? { ...item, unlocked: true, unlockedAt } : item,
    ),
  }
}

// Mensajes del toast tras completar una tarea: el XP ganado y, por cada logro nuevo, un aviso aparte.
export function rewardMessages(reward: CompletionReward) {
  const achievements = reward.newAchievements.map((item) => `¡Nuevo logro desbloqueado! ${item.title}`)

  return [`+${reward.xpGained} XP`, ...achievements]
}
