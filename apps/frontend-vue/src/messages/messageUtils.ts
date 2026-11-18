import type { DirectMessage, MessageContact } from '../types/api'

// Mismo módulo en la app React y en la Vue.
export const pollIntervalMs = 3000
export const maxMessageLength = 2000
const previewLength = 60

export function hasUnread(messages: DirectMessage[], meId: string) {
  return messages.some((message) => message.receiverId === meId && message.readAt === null)
}

export function isMine(message: DirectMessage, meId: string) {
  return message.senderId === meId
}

// Vista previa del último mensaje en la lista de contactos.
export function previewOf(contact: MessageContact) {
  const last = contact.lastMessage
  if (!last) return 'Sin mensajes todavía'

  const text = last.content.length > previewLength ? `${last.content.slice(0, previewLength)}…` : last.content

  return last.fromMe ? `Tú: ${text}` : text
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}
