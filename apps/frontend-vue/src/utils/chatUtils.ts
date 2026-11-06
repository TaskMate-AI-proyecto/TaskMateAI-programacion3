import type { AiChatTurn, AiTaskChanges } from '../types/api'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export interface ChatThread {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export const chatStorageKey = 'taskmate.chat-threads'
// Turnos de historial que se envían a la IA: el backend acepta como máximo 20.
export const maxHistoryTurns = 20
const titleLength = 36

export function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createMessage(role: ChatMessage['role'], text: string): ChatMessage {
  return { id: createId(), role, text, createdAt: new Date().toISOString() }
}

export function createThread(): ChatThread {
  return { id: createId(), title: 'Nueva conversación', updatedAt: new Date().toISOString(), messages: [] }
}

export function titleFrom(text: string) {
  return text.length > titleLength ? `${text.slice(0, titleLength)}…` : text
}

export function toHistory(messages: ChatMessage[]): AiChatTurn[] {
  return messages.slice(-maxHistoryTurns).map(({ role, text }) => ({ role, text }))
}

// Agrega la pregunta al hilo; el primer mensaje también le pone título.
export function withQuestion(thread: ChatThread, question: ChatMessage): ChatThread {
  return {
    ...thread,
    title: thread.messages.length === 0 ? titleFrom(question.text) : thread.title,
    updatedAt: question.createdAt,
    messages: [...thread.messages, question],
  }
}

export function matchesSearch(thread: ChatThread, search: string) {
  const query = search.trim().toLowerCase()
  if (!query) return true

  return thread.title.toLowerCase().includes(query) || thread.messages.some((message) => message.text.toLowerCase().includes(query))
}

export function threadStatus(thread: ChatThread) {
  const count = thread.messages.length
  if (count === 0) return 'Sin mensajes'

  const last = thread.messages[count - 1]

  return last.role === 'user' ? `${count} mensajes · esperando respuesta` : `${count} mensajes · respondido`
}

export function hasTaskChanges(changes: AiTaskChanges) {
  return changes.created.length > 0 || changes.updated.length > 0 || changes.deletedIds.length > 0
}
