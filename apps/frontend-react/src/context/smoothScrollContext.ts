import { createContext } from 'react'

export interface SmoothScrollContextValue {
  lockScroll: () => void
  unlockScroll: () => void
}

// Sin proveedor (por ejemplo en tests) las llamadas no hacen nada.
export const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  lockScroll: () => {},
  unlockScroll: () => {},
})
