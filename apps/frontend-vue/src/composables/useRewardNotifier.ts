import { useGamificationStore } from '../stores/gamification'
import { useToastStore } from '../stores/toast'
import type { TaskWithReward } from '../types/api'
import { rewardMessages } from '../utils/gamification'

// Tras guardar una tarea: si pasó a completada, actualiza el indicador y muestra el XP y los logros nuevos.
// Llamar en setup() de la vista, donde Pinia ya está activo.
export function useRewardNotifier() {
  const toast = useToastStore()
  const gamification = useGamificationStore()

  return function announceCompletion(task: TaskWithReward) {
    const reward = task.reward
    if (!reward) return

    gamification.applyCompletion(reward)
    rewardMessages(reward).forEach((message, index) => toast.notify(message, index === 0 ? 'reward' : 'achievement'))
  }
}
