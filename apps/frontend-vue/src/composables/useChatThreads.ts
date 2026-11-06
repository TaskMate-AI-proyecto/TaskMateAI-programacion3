import { computed, ref, watch } from 'vue'
import { sendChatMessage } from '../api/aiApi'
import { getAiErrorMessage } from '../api/errors'
import { storage } from '../lib/storage'
import { useTaskSyncStore } from '../stores/taskSync'
import { useToastStore } from '../stores/toast'
import type { AiTaskChanges } from '../types/api'
import {
  chatStorageKey,
  createMessage,
  createThread,
  hasTaskChanges,
  matchesSearch,
  toHistory,
  withQuestion,
  type ChatThread,
} from '../utils/chatUtils'

// Los hilos viven en el navegador del usuario. Sin almacenamiento disponible el chat sigue en memoria.
function readThreads(): ChatThread[] {
  const raw = storage.getItem(chatStorageKey)
  if (!raw) return []

  try {
    return JSON.parse(raw) as ChatThread[]
  } catch {
    return []
  }
}

// Estado de la conversación con la IA: hilos, búsqueda, envío y avisos hacia el Dashboard.
export function useChatThreads() {
  const taskSync = useTaskSyncStore()
  const toast = useToastStore()
  const threads = ref<ChatThread[]>(readThreads())
  const selectedId = ref<string | null>(null)
  const search = ref('')
  const isSending = ref(false)

  watch(threads, (value) => storage.setItem(chatStorageKey, JSON.stringify(value)), { deep: true })

  const active = computed(() => threads.value.find((thread) => thread.id === selectedId.value) ?? threads.value[0] ?? null)
  const activeId = computed(() => active.value?.id ?? null)
  const visibleThreads = computed(() => threads.value.filter((thread) => matchesSearch(thread, search.value)))

  function upsertThread(thread: ChatThread) {
    const exists = threads.value.some((item) => item.id === thread.id)
    threads.value = exists
      ? threads.value.map((item) => (item.id === thread.id ? thread : item))
      : [thread, ...threads.value]
    selectedId.value = thread.id
  }

  function appendAnswer(threadId: string, text: string) {
    const answer = createMessage('assistant', text)

    threads.value = threads.value.map((thread) =>
      thread.id === threadId ? { ...thread, updatedAt: answer.createdAt, messages: [...thread.messages, answer] } : thread,
    )
  }

  // Reutiliza una conversación vacía si existe, así no se acumulan hilos sin mensajes.
  function startConversation() {
    const empty = threads.value.find((thread) => thread.messages.length === 0)

    if (empty) {
      selectedId.value = empty.id
      return
    }

    upsertThread(createThread())
  }

  // La respuesta trae los cambios de tareas aplicados en el backend: si hubo alguno, el Dashboard vuelve a pedir el listado.
  function afterAnswer(changes: AiTaskChanges) {
    if (!hasTaskChanges(changes)) return

    taskSync.notifyTasksChanged()
    toast.notify('Tus tareas se actualizaron desde el chat.')
  }

  async function sendMessage(text: string) {
    const message = text.trim()
    if (!message || isSending.value) return

    const thread = active.value ?? createThread()
    const history = toHistory(thread.messages)
    const updated = withQuestion(thread, createMessage('user', message))

    upsertThread(updated)
    isSending.value = true

    try {
      const answer = await sendChatMessage(message, history)
      appendAnswer(updated.id, answer.reply)
      afterAnswer(answer.changes)
    } catch (error) {
      toast.notify(getAiErrorMessage(error), 'error')
    } finally {
      isSending.value = false
    }
  }

  return {
    threads: visibleThreads,
    active,
    activeId,
    search,
    isSending,
    setSearch: (value: string) => {
      search.value = value
    },
    selectThread: (id: string) => {
      selectedId.value = id
    },
    startConversation,
    sendMessage,
  }
}
