import { createContext } from 'react'

export interface CommandPaletteContextValue {
  open: () => void
  close: () => void
}

// Sin proveedor no hay paleta: el hook que la usa lanza un error claro.
export const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)
