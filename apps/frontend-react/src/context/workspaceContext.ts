import { createContext } from 'react'
import type { Workspace } from '../types/api'

export interface WorkspaceContextValue {
  workspaces: Workspace[]
  // null significa "Todos": sin filtro por espacio.
  selectedId: string | null
  select: (id: string | null) => void
  reload: () => Promise<void>
}

// Sin proveedor (vistas aisladas y pruebas) el valor por defecto es "Todos" y sin espacios.
export const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  selectedId: null,
  select: () => undefined,
  reload: async () => undefined,
})
