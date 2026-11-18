import { createContext } from 'react'

// reward: XP ganado al completar una tarea. achievement: logro nuevo desbloqueado.
export type ToastKind = 'success' | 'error' | 'reward' | 'achievement'

export interface ToastContextValue {
  notify: (message: string, kind?: ToastKind) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
