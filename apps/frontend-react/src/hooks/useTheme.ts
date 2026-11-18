import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { applyTheme, changeTheme, followSystemTheme, nextTheme, onThemeChange, originOf, resolveTheme, type ThemeName } from '../theme/theme'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(resolveTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Otros controles de tema (cabecera, Ajustes) cambian el mismo valor: esta instancia lo sigue.
  useEffect(() => onThemeChange(setTheme), [])

  useEffect(() => followSystemTheme((next) => {
    applyTheme(next)
    setTheme(next)
  }), [])

  // flushSync: el nuevo tema se pinta dentro de la captura de la transición, no después.
  const select = useCallback((next: ThemeName, event?: MouseEvent) => {
    changeTheme(next, originOf(event), (value) => flushSync(() => setTheme(value)))
  }, [])

  const toggle = useCallback((event?: MouseEvent) => {
    select(nextTheme(theme), event)
  }, [select, theme])

  return { theme, toggle, select }
}
