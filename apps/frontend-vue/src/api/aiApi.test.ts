import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http } from './http'
import { sendChatMessage } from './aiApi'
import type { AiChatResponse } from '../types/api'

vi.mock('./http')

const emptyChanges = { created: [], updated: [], deletedIds: [] }

describe('sendChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envía el mensaje y el historial a POST /api/ai/chat', async () => {
    const history = [{ role: 'user' as const, text: 'Hola' }]
    const response: AiChatResponse = { success: true, reply: 'Hola, ¿en qué te ayudo?', changes: emptyChanges }
    vi.mocked(http.post).mockResolvedValue({ data: response })

    await sendChatMessage('¿Qué tengo hoy?', history)

    expect(http.post).toHaveBeenCalledWith('/api/ai/chat', { message: '¿Qué tengo hoy?', history })
  })

  it('devuelve la respuesta y los cambios de tareas que aplicó el backend', async () => {
    const changes = { created: [], updated: [], deletedIds: ['t1'] }
    vi.mocked(http.post).mockResolvedValue({ data: { success: true, reply: 'Eliminada.', changes } })

    const result = await sendChatMessage('borra Entregar TP', [])

    expect(result).toEqual({ reply: 'Eliminada.', changes })
  })
})
