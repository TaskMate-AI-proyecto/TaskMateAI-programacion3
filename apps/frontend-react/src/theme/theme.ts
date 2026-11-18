export type ThemeName = 'light' | 'dark'

export interface ThemeOrigin {
  x: number
  y: number
}

// Mismo módulo en la app React y en la Vue: la lógica del tema no depende del framework.
export const themeStorageKey = 'taskmate.theme'
const darkQuery = '(prefers-color-scheme: dark)'
const themeEvent = 'taskmate:theme'

function isThemeName(value: unknown): value is ThemeName {
  return value === 'light' || value === 'dark'
}

// Preferencia elegida por el usuario; null si nunca eligió (entonces manda el sistema).
export function storedTheme(): ThemeName | null {
  try {
    const value = window.localStorage.getItem(themeStorageKey)
    return isThemeName(value) ? value : null
  } catch {
    return null
  }
}

export function systemTheme(): ThemeName {
  return typeof window.matchMedia === 'function' && window.matchMedia(darkQuery).matches ? 'dark' : 'light'
}

export function resolveTheme(): ThemeName {
  return storedTheme() ?? systemTheme()
}

// La clase .dark en <html> activa las variantes dark: y la paleta oscura de index.css.
export function applyTheme(theme: ThemeName) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  // Avisa a los demás controles de tema (cabecera y Ajustes) para que muestren el mismo valor.
  window.dispatchEvent(new CustomEvent<ThemeName>(themeEvent, { detail: theme }))
}

export function onThemeChange(listener: (theme: ThemeName) => void) {
  const handler = (event: Event) => {
    if (event instanceof CustomEvent && isThemeName(event.detail)) listener(event.detail)
  }

  window.addEventListener(themeEvent, handler)

  return () => window.removeEventListener(themeEvent, handler)
}

export function persistTheme(theme: ThemeName) {
  try {
    window.localStorage.setItem(themeStorageKey, theme)
  } catch {
    // Almacenamiento bloqueado: el cambio dura hasta recargar la página.
  }
}

export function nextTheme(theme: ThemeName): ThemeName {
  return theme === 'dark' ? 'light' : 'dark'
}

// Origen del círculo de tinta: el punto del clic. Sin coordenadas (teclado) se usa el centro de la pantalla.
export function originOf(event?: Pick<MouseEvent, 'clientX' | 'clientY'>): ThemeOrigin {
  if (event && (event.clientX || event.clientY)) return { x: event.clientX, y: event.clientY }

  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

function setOrigin(origin: ThemeOrigin) {
  const style = document.documentElement.style
  style.setProperty('--x', `${origin.x}px`)
  style.setProperty('--y', `${origin.y}px`)
}

// Cambia el tema con la transición "gota de tinta" cuando el navegador tiene View Transitions API.
// commit actualiza el estado de la UI dentro de la misma captura para que el nuevo tema se vea a la vez.
export function changeTheme(next: ThemeName, origin: ThemeOrigin, commit: (theme: ThemeName) => void) {
  const toggleThemeLogic = () => {
    applyTheme(next)
    commit(next)
    persistTheme(next)
  }

  if (!document.startViewTransition) {
    toggleThemeLogic()
    return
  }

  setOrigin(origin)
  document.startViewTransition(toggleThemeLogic)
}

// Mientras el usuario no haya elegido tema, sigue los cambios de prefers-color-scheme. Devuelve el cese de escucha.
export function followSystemTheme(onChange: (theme: ThemeName) => void) {
  if (typeof window.matchMedia !== 'function') return () => {}

  const query = window.matchMedia(darkQuery)
  const listener = () => {
    if (storedTheme() === null) onChange(systemTheme())
  }

  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
