import { useContext } from 'react'
import { CommandPaletteContext } from '../context/commandPaletteContext'

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)

  if (!context) {
    throw new Error('useCommandPalette debe usarse dentro de CommandPaletteProvider')
  }

  return context
}
