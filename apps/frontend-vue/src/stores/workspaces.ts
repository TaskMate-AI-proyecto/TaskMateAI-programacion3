import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getWorkspaces } from '../api/workspacesApi'
import type { Workspace } from '../types/api'

const storageKey = 'taskmate.workspace'

// La selección es una preferencia de este navegador: si no hay almacenamiento, vive solo en memoria.
function readStoredId() {
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

function storeId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(storageKey, id)
    else window.localStorage.removeItem(storageKey)
  } catch {
    // Sin almacenamiento disponible la selección solo dura mientras la página esté abierta.
  }
}

// Espacios del usuario y el espacio activo. Un espacio guardado que ya no existe vuelve a "Todos" (null).
export const useWorkspacesStore = defineStore('workspaces', () => {
  const workspaces = ref<Workspace[]>([])
  const storedId = ref<string | null>(readStoredId())
  const selectedId = computed(() => (workspaces.value.some((workspace) => workspace.id === storedId.value) ? storedId.value : null))

  async function load() {
    try {
      workspaces.value = await getWorkspaces()
    } catch {
      workspaces.value = []
    }
  }

  function select(id: string | null) {
    storedId.value = id
    storeId(id)
  }

  return { workspaces, selectedId, load, select }
})
