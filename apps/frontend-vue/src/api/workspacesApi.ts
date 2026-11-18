import { http } from './http'
import type { Workspace } from '../types/api'

export async function getWorkspaces() {
  const { data } = await http.get<Workspace[]>('/api/workspaces')
  return data
}

export interface WorkspaceInput {
  name: string
  color?: string
  memberIds?: string[]
}

export async function createWorkspace(input: WorkspaceInput) {
  const { data } = await http.post<Workspace>('/api/workspaces', input)
  return data
}

export async function addWorkspaceMembers(workspaceId: string, memberIds: string[]) {
  const { data } = await http.post<{ success: true; added: number }>(`/api/workspaces/${workspaceId}/members`, { memberIds })
  return data
}
