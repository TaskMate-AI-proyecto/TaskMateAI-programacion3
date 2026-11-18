import axiosClient from './axiosClient'
import type { DirectMessage, MessageContact } from '../types/api'

// Canal grupal de un espacio: mensajes del más antiguo al más reciente.
export async function getGroupMessages(workspaceId: string) {
  const { data } = await axiosClient.get<DirectMessage[]>('/api/messages', { params: { workspaceId } })
  return data
}

export async function sendGroupMessage(workspaceId: string, content: string) {
  const { data } = await axiosClient.post<DirectMessage>('/api/messages', { workspaceId, content })
  return data
}

export async function getContacts() {
  const { data } = await axiosClient.get<MessageContact[]>('/api/messages/contacts')
  return data
}

export async function getConversation(userId: string) {
  const { data } = await axiosClient.get<DirectMessage[]>(`/api/messages/${userId}`)
  return data
}

export async function sendMessage(receiverId: string, content: string) {
  const { data } = await axiosClient.post<DirectMessage>('/api/messages', { receiverId, content })
  return data
}

export async function markConversationRead(userId: string) {
  await axiosClient.patch(`/api/messages/${userId}/read`)
}
