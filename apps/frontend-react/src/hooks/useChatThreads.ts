import { useEffect, useState } from 'react'
import { sendChatMessage } from '../api/aiApi'
import { getAiErrorMessage } from '../api/errors'
import type { AiChatTurn, AiTaskChanges } from '../types/api'
import { useSafeAction } from './useSafeAction'
import { useTaskSync } from './useTaskSync'
import { useToast } from './useToast'

function hasTaskChanges(changes: AiTaskChanges) {
  return changes.created.length > 0 || changes.updated.length > 0 || changes.deletedIds.length > 0
}

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

const storageKey = 'taskmate.chat-threads'
// Turnos de historial que se envían a la IA: el backend acepta como máximo 20.
const maxHistoryTurns = 20
const titleLength = 36

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// Los hilos viven en el navegador del usuario. Sin almacenamiento disponible el chat sigue en memoria.
function readThreads(): ChatThread[] {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as ChatThread[]) : []
  } catch {
    return []
  }
}

function writeThreads(threads: ChatThread[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(threads))
  } catch {
    // Sin almacenamiento el historial se pierde al recargar, pero la conversación funciona.
  }
}

function createMessage(role: ChatMessage['role'], text: string): ChatMessage {
  return { id: createId(), role, text, createdAt: new Date().toISOString() }
}

function createThread(): ChatThread {
  return { id: createId(), title: 'Nueva conversación', updatedAt: new Date().toISOString(), messages: [] }
}

function titleFrom(text: string) {
  return text.length > titleLength ? `${text.slice(0, titleLength)}…` : text
}

function toHistory(messages: ChatMessage[]): AiChatTurn[] {
  return messages.slice(-maxHistoryTurns).map(({ role, text }) => ({ role, text }))
}

// Agrega la pregunta al hilo; el primer mensaje también le pone título.
function withQuestion(thread: ChatThread, question: ChatMessage): ChatThread {
  return {
    ...thread,
    title: thread.messages.length === 0 ? titleFrom(question.text) : thread.title,
    updatedAt: question.createdAt,
    messages: [...thread.messages, question],
  }
}

function matchesSearch(thread: ChatThread, query: string) {
  if (!query) return true

  return thread.title.toLowerCase().includes(query) || thread.messages.some((message) => message.text.toLowerCase().includes(query))
}

export function useChatThreads() {
  const runSafely = useSafeAction()
  const { notifyTasksChanged } = useTaskSync()
  const { notify } = useToast()
  const [threads, setThreads] = useState<ChatThread[]>(readThreads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    writeThreads(threads)
  }, [threads])

  const active = threads.find((thread) => thread.id === activeId) ?? threads[0] ?? null
  const query = search.trim().toLowerCase()
  const visibleThreads = threads.filter((thread) => matchesSearch(thread, query))

  function upsertThread(thread: ChatThread) {
    setThreads((current) =>
      current.some((item) => item.id === thread.id)
        ? current.map((item) => (item.id === thread.id ? thread : item))
        : [thread, ...current],
    )
    setActiveId(thread.id)
  }

  function appendAnswer(threadId: string, answer: ChatMessage) {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId ? { ...thread, updatedAt: answer.createdAt, messages: [...thread.messages, answer] } : thread,
      ),
    )
  }

  // Reutiliza una conversación vacía si existe, así no se acumulan hilos sin mensajes.
  function startConversation() {
    const empty = threads.find((thread) => thread.messages.length === 0)

    if (empty) {
      setActiveId(empty.id)
      return
    }

    const thread = createThread()
    setThreads((current) => [thread, ...current])
    setActiveId(thread.id)
  }

  async function sendMessage(text: string) {
    const message = text.trim()
    if (!message || isSending) return

    const thread = active ?? createThread()
    const history = toHistory(thread.messages)
    const updated = withQuestion(thread, createMessage('user', message))

    upsertThread(updated)
    setIsSending(true)
    const result = await runSafely(() => sendChatMessage(message, history), getAiErrorMessage)
    setIsSending(false)

    if (result.ok) afterAnswer(updated.id, result.value)
  }

  // La respuesta llega con los cambios de tareas aplicados en el backend: si hubo alguno,
  // se avisa a las vistas para que vuelvan a pedir el listado.
  function afterAnswer(threadId: string, answer: { reply: string; changes: AiTaskChanges }) {
    appendAnswer(threadId, createMessage('assistant', answer.reply))

    if (!hasTaskChanges(answer.changes)) return

    notifyTasksChanged()
    notify('Tus tareas se actualizaron desde el chat.')
  }

  return {
    threads: visibleThreads,
    active,
    activeId: active?.id ?? null,
    search,
    setSearch,
    selectThread: setActiveId,
    startConversation,
    sendMessage,
    isSending,
  }
}
