import { useCallback, useEffect, useState } from 'react'

export type ViewMode = 'list' | 'kanban'

export const viewModeStorageKey = 'taskmate_view_mode'

// Aviso dentro de la misma pestaña: lo usa la paleta de comandos para cambiar la vista del Dashboard ya abierto.
const viewModeEvent = 'taskmate:view-mode'

const viewModes: ViewMode[] = ['list', 'kanban']

function isViewMode(value: unknown): value is ViewMode {
  return viewModes.some((mode) => mode === value)
}

// Vista guardada por el usuario; si no hay ninguna o el almacenamiento falla, se usa la lista.
export function storedViewMode(): ViewMode {
  try {
    const value = window.localStorage.getItem(viewModeStorageKey)
    return isViewMode(value) ? value : 'list'
  } catch {
    return 'list'
  }
}

function persistViewMode(mode: ViewMode) {
  try {
    window.localStorage.setItem(viewModeStorageKey, mode)
  } catch {
    // Almacenamiento bloqueado: la vista dura lo que la pestaña.
  }
}

// Cambia la vista desde fuera del Dashboard (paleta de comandos): guarda la preferencia y avisa a la vista montada.
export function requestViewMode(mode: ViewMode) {
  persistViewMode(mode)
  window.dispatchEvent(new CustomEvent<ViewMode>(viewModeEvent, { detail: mode }))
}

// Mantiene la vista activa en localStorage y la sincroniza entre pestañas abiertas.
export function useViewMode() {
  const [mode, setModeState] = useState<ViewMode>(storedViewMode)

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === viewModeStorageKey) setModeState(storedViewMode())
    }

    function handleRequest(event: Event) {
      if (event instanceof CustomEvent && isViewMode(event.detail)) setModeState(event.detail)
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(viewModeEvent, handleRequest)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(viewModeEvent, handleRequest)
    }
  }, [])

  const setMode = useCallback((next: ViewMode) => {
    persistViewMode(next)
    setModeState(next)
  }, [])

  return [mode, setMode] as const
}
