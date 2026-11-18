import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getGamificationProfile } from '../api/gamificationApi'
import type { CompletionReward, GamificationProfile } from '../types/api'
import { applyReward } from '../utils/gamification'
import { GamificationContext } from './gamificationContext'

// Mantiene el perfil de gamificación para el indicador de la cápsula lateral y se actualiza con cada recompensa.
export function GamificationProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<GamificationProfile | null>(null)

  useEffect(() => {
    let active = true

    getGamificationProfile()
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch(() => setProfile(null))

    return () => {
      active = false
    }
  }, [])

  const applyCompletion = useCallback((reward: CompletionReward) => {
    setProfile((current) => (current ? applyReward(current, reward) : current))
  }, [])

  const value = useMemo(() => ({ profile, applyCompletion }), [profile, applyCompletion])

  return <GamificationContext value={value}>{children}</GamificationContext>
}
