import { createContext } from 'react'
import type { CompletionReward, GamificationProfile } from '../types/api'

export interface GamificationContextValue {
  profile: GamificationProfile | null
  applyCompletion: (reward: CompletionReward) => void
}

// Sin proveedor (p. ej. en pruebas de vistas aisladas) el valor es null y los componentes no muestran progreso.
export const GamificationContext = createContext<GamificationContextValue | null>(null)
