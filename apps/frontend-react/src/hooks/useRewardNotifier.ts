import { useCallback } from 'react'
import type { TaskWithReward } from '../types/api'
import { rewardMessages } from '../utils/gamification'
import { useGamification } from './useGamification'
import { useToast } from './useToast'

// Tras guardar una tarea: si pasó a completada, actualiza el indicador y muestra el XP y los logros nuevos.
export function useRewardNotifier() {
  const { notify } = useToast()
  const gamification = useGamification()

  return useCallback(
    (task: TaskWithReward) => {
      const reward = task.reward
      if (!reward) return

      gamification?.applyCompletion(reward)
      rewardMessages(reward).forEach((message, index) => notify(message, index === 0 ? 'reward' : 'achievement'))
    },
    [gamification, notify],
  )
}
