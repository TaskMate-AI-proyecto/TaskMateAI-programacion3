import { useContext } from 'react'
import { GamificationContext } from '../context/gamificationContext'

// Devuelve null si no hay GamificationProvider por encima (vistas aisladas y pruebas).
export function useGamification() {
  return useContext(GamificationContext)
}
