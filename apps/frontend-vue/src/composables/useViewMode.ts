import { onMounted, onUnmounted, ref } from 'vue'
import { storage } from '../lib/storage'

export type ViewMode = 'list' | 'kanban'

export const viewModeStorageKey = 'taskmate_view_mode'

// Aviso dentro de la misma pestaña: la paleta de comandos cambia la vista de un Dashboard ya abierto.
const viewModeEvent = 'taskmate:view-mode'

const viewModes: ViewMode[] = ['list', 'kanban']

function isViewMode(value: unknown): value is ViewMode {
  return viewModes.some((mode) => mode === value)
}

// Vista guardada por el usuario; si no hay ninguna, se usa la lista.
export function storedViewMode(): ViewMode {
  const value = storage.getItem(viewModeStorageKey)
  return isViewMode(value) ? value : 'list'
}

// Cambia la vista desde fuera del Dashboard (paleta de comandos): guarda la preferencia y avisa a la vista montada.
export function requestViewMode(mode: ViewMode) {
  storage.setItem(viewModeStorageKey, mode)
  window.dispatchEvent(new CustomEvent<ViewMode>(viewModeEvent, { detail: mode }))
}

// Mantiene la vista activa en localStorage y la sincroniza entre pestañas abiertas.
export function useViewMode() {
  const viewMode = ref<ViewMode>(storedViewMode())

  function handleStorage(event: StorageEvent) {
    if (event.key === viewModeStorageKey) viewMode.value = storedViewMode()
  }

  function handleRequest(event: Event) {
    if (event instanceof CustomEvent && isViewMode(event.detail)) viewMode.value = event.detail
  }

  function setViewMode(next: ViewMode) {
    viewMode.value = next
    storage.setItem(viewModeStorageKey, next)
  }

  onMounted(() => {
    window.addEventListener('storage', handleStorage)
    window.addEventListener(viewModeEvent, handleRequest)
  })
  onUnmounted(() => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(viewModeEvent, handleRequest)
  })

  return { viewMode, setViewMode }
}
