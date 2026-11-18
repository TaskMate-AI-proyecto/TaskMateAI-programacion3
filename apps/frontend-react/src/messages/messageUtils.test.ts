import { describe, expect, it } from 'vitest'
import { hasUnread, isMine, previewOf, timeLabel } from './messageUtils'
import type { DirectMessage, MessageContact } from '../types/api'

const incoming: DirectMessage = { id: 'm1', senderId: 'u2', receiverId: 'u1', content: 'Hola', readAt: null, createdAt: '2026-11-10T10:00:00.000Z' }

describe('messageUtils', () => {
  it('detecta mensajes no leídos recibidos por mí', () => {
    expect(hasUnread([incoming], 'u1')).toBe(true)
    expect(hasUnread([{ ...incoming, readAt: '2026-11-10T10:01:00.000Z' }], 'u1')).toBe(false)
    expect(hasUnread([incoming], 'u2')).toBe(false)
  })

  it('distingue los mensajes propios', () => {
    expect(isMine(incoming, 'u2')).toBe(true)
    expect(isMine(incoming, 'u1')).toBe(false)
  })

  it('recorta la vista previa larga y antepone "Tú:" a mis mensajes', () => {
    const contact = (content: string, fromMe: boolean): MessageContact => ({
      id: 'u2',
      email: 'bob@example.com',
      unreadCount: 0,
      lastMessage: { content, createdAt: '2026-11-10T10:00:00.000Z', fromMe },
    })

    expect(previewOf(contact('Hola', true))).toBe('Tú: Hola')
    expect(previewOf(contact('x'.repeat(80), false))).toBe(`${'x'.repeat(60)}…`)
    expect(previewOf({ id: 'u3', email: 'c@x.com', unreadCount: 0, lastMessage: null })).toBe('Sin mensajes todavía')
  })

  it('formatea la hora de un mensaje', () => {
    expect(timeLabel('2026-11-10T10:05:00.000Z')).toMatch(/\d{2}:\d{2}/)
  })
})
