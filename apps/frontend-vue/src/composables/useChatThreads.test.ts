import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendChatMessage } from '../api/aiApi'
import { useTaskSyncStore } from '../stores/taskSync'
import { useToastStore } from '../stores/toast'
import type { AiTaskChanges } from '../types/api'
import { chatStorageKey, type ChatThread } from '../utils/chatUtils'
import { useChatThreads } from './useChatThreads'

vi.mock('../api/aiApi', () => ({ sendChatMessage: vi.fn() }))

const noChanges: AiTaskChanges = { created: [], updated: [], deletedIds: [] }
const reply = 'Claro, aquí tienes los pasos.'

describe('useChatThreads', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(sendChatMessage).mockResolvedValue({ reply, changes: noChanges })
  })

  it('envía el mensaje, guarda la respuesta y titula el hilo con la pregunta', async () => {
    const chat = useChatThreads()

    await chat.sendMessage('  Ayúdame con el parcial  ')

    expect(sendChatMessage).toHaveBeenCalledWith('Ayúdame con el parcial', [])
    expect(chat.active.value?.title).toBe('Ayúdame con el parcial')
    expect(chat.active.value?.messages.map((message) => message.text)).toEqual(['Ayúdame con el parcial', reply])
    expect(chat.isSending.value).toBe(false)
  })

  it('envía el historial del hilo en el siguiente mensaje', async () => {
    const chat = useChatThreads()

    await chat.sendMessage('Primera')
    await chat.sendMessage('Segunda')

    expect(vi.mocked(sendChatMessage).mock.calls[1][1]).toEqual([
      { role: 'user', text: 'Primera' },
      { role: 'assistant', text: reply },
    ])
  })

  it('ignora mensajes vacíos y no envía otro mientras la IA responde', async () => {
    vi.mocked(sendChatMessage).mockReturnValueOnce(new Promise(() => {}))
    const chat = useChatThreads()

    await chat.sendMessage('   ')
    void chat.sendMessage('uno')
    await chat.sendMessage('dos')

    expect(sendChatMessage).toHaveBeenCalledTimes(1)
    expect(chat.isSending.value).toBe(true)
  })

  it('avisa del error como toast y no agrega respuesta cuando la IA falla', async () => {
    vi.mocked(sendChatMessage).mockRejectedValue(new Error('caído'))
    const chat = useChatThreads()

    await chat.sendMessage('Hola')

    const toast = useToastStore()
    expect(toast.toasts).toEqual([
      expect.objectContaining({ message: 'La IA no pudo completar la solicitud. Inténtalo más tarde.', kind: 'error' }),
    ])
    expect(chat.active.value?.messages.map((message) => message.role)).toEqual(['user'])
    expect(chat.isSending.value).toBe(false)
  })

  it('avisa al Dashboard y notifica cuando la IA cambió tareas', async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: 'Creé la tarea.',
      changes: { created: [], updated: [], deletedIds: ['t1'] },
    })
    const chat = useChatThreads()

    await chat.sendMessage('borra la tarea')

    expect(useTaskSyncStore().version).toBe(1)
    expect(useToastStore().toasts).toEqual([
      expect.objectContaining({ message: 'Tus tareas se actualizaron desde el chat.', kind: 'success' }),
    ])
  })

  it('no avisa al Dashboard cuando la respuesta no cambió tareas', async () => {
    const chat = useChatThreads()

    await chat.sendMessage('qué me conviene hacer primero')

    expect(useTaskSyncStore().version).toBe(0)
    expect(useToastStore().toasts).toEqual([])
  })

  it('reutiliza una conversación vacía al pedir una nueva', () => {
    const chat = useChatThreads()

    chat.startConversation()
    chat.startConversation()

    expect(chat.threads.value).toHaveLength(1)
    expect(chat.threads.value[0].messages).toEqual([])
  })

  it('filtra el historial con la búsqueda', () => {
    localStorage.setItem(
      chatStorageKey,
      JSON.stringify([
        { id: 't1', title: 'Parcial de historia', updatedAt: '2026-01-01T00:00:00.000Z', messages: [] },
        { id: 't2', title: 'Compras de la semana', updatedAt: '2026-01-02T00:00:00.000Z', messages: [] },
      ]),
    )
    const chat = useChatThreads()

    chat.setSearch('compras')

    expect(chat.threads.value.map((thread) => thread.id)).toEqual(['t2'])
  })

  it('selecciona el hilo elegido como activo', () => {
    localStorage.setItem(
      chatStorageKey,
      JSON.stringify([
        { id: 't1', title: 'Uno', updatedAt: '2026-01-01T00:00:00.000Z', messages: [] },
        { id: 't2', title: 'Dos', updatedAt: '2026-01-02T00:00:00.000Z', messages: [] },
      ]),
    )
    const chat = useChatThreads()

    chat.selectThread('t2')

    expect(chat.activeId.value).toBe('t2')
  })

  it('guarda los hilos en el navegador y los recupera al volver', async () => {
    const chat = useChatThreads()

    await chat.sendMessage('Recuérdame esto')
    await flushPromises()

    const saved = JSON.parse(localStorage.getItem(chatStorageKey) ?? '[]') as ChatThread[]
    expect(saved[0].title).toBe('Recuérdame esto')
    expect(useChatThreads().threads.value[0].title).toBe('Recuérdame esto')
  })

  it('arranca sin hilos cuando el almacenamiento guardado está corrupto', () => {
    localStorage.setItem(chatStorageKey, '{no-es-json')

    expect(useChatThreads().threads.value).toEqual([])
  })
})
