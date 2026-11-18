import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getGamificationProfile } from '../api/gamificationApi'
import type { CompletionReward, GamificationProfile } from '../types/api'
import { applyReward } from '../utils/gamification'

// Perfil de gamificación para el indicador de la cápsula lateral. Se actualiza con cada recompensa.
export const useGamificationStore = defineStore('gamification', () => {
  const profile = ref<GamificationProfile | null>(null)

  // Si falla no es crítico: el indicador simplemente no se muestra.
  async function load() {
    try {
      profile.value = await getGamificationProfile()
    } catch {
      profile.value = null
    }
  }

  function applyCompletion(reward: CompletionReward) {
    if (profile.value) profile.value = applyReward(profile.value, reward)
  }

  return { profile, load, applyCompletion }
})
