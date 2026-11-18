import { http } from './http'
import type { DirectMessage, MessageContact } from '../types/api'

// Canal grupal de un espacio: mensajes del más antiguo al más reciente.
export async function getGroupMessages(workspaceId: string) {
  const { data } = await http.get<DirectMessage[]>('/api/messages', { params: { workspaceId } })
  return data
}

export async function sendGroupMessage(workspaceId: string, content: string) {
  const { data } = await http.post<DirectMessage>('/api/messages', { workspaceId, content })
  return data
}

export async function getContacts() {
  const { data } = await http.get<MessageContact[]>('/api/messages/contacts')
  return data
}

export async function getConversation(userId: string) {
  const { data } = await http.get<DirectMessage[]>(`/api/messages/${userId}`)
  return data
}

export async function sendMessage(receiverId: string, content: string) {
  const { data } = await http.post<DirectMessage>('/api/messages', { receiverId, content })
  return data
}

export async function markConversationRead(userId: string) {
  await http.patch(`/api/messages/${userId}/read`)
}
