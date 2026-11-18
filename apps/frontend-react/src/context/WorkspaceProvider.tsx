import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getWorkspaces } from '../api/workspacesApi'
import type { Workspace } from '../types/api'
import { WorkspaceContext } from './workspaceContext'

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

// Espacios del usuario y el espacio activo. Un espacio guardado que ya no existe vuelve a "Todos".
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [storedId, setStoredId] = useState<string | null>(readStoredId)

  const reload = useCallback(async () => {
    try {
      setWorkspaces(await getWorkspaces())
    } catch {
      setWorkspaces([])
    }
  }, [])

  useEffect(() => {
    // La primera carga sale en un temporizador: no se actualiza estado dentro del propio efecto.
    const first = window.setTimeout(() => void reload(), 0)

    return () => window.clearTimeout(first)
  }, [reload])

  const select = useCallback((id: string | null) => {
    setStoredId(id)
    storeId(id)
  }, [])

  const selectedId = workspaces.some((workspace) => workspace.id === storedId) ? storedId : null
  const value = useMemo(() => ({ workspaces, selectedId, select, reload }), [workspaces, selectedId, select, reload])

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>
}
