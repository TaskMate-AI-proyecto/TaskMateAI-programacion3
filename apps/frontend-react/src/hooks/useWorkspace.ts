import { useContext } from 'react'
import { WorkspaceContext } from '../context/workspaceContext'

export function useWorkspace() {
  return useContext(WorkspaceContext)
}

// Id del espacio activo para filtrar; cadena vacía significa "Todos".
export function useActiveWorkspaceId() {
  return useWorkspace().selectedId ?? ''
}
