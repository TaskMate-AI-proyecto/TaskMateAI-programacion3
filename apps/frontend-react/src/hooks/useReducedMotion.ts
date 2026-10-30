import { useSyncExternalStore } from 'react'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function canMatchMedia() {
  return typeof window.matchMedia === 'function'
}

function subscribe(onChange: () => void) {
  if (!canMatchMedia()) return () => {}

  const media = window.matchMedia(reducedMotionQuery)
  media.addEventListener('change', onChange)

  return () => media.removeEventListener('change', onChange)
}

function getSnapshot() {
  return canMatchMedia() && window.matchMedia(reducedMotionQuery).matches
}

// Se actualiza en vivo si el usuario cambia la preferencia del sistema.
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
