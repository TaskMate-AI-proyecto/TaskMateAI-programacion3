import { describe, expect, it } from 'vitest'
import {
  createMessage,
  hasTaskChanges,
  matchesSearch,
  maxHistoryTurns,
  threadStatus,
  titleFrom,
  toHistory,
  withQuestion,
  type ChatThread,
} from './chatUtils'

function thread(overrides: Partial<ChatThread> = {}): ChatThread {
  return { id: 't1', title: 'Parcial de historia', updatedAt: '2026-01-01T00:00:00.000Z', messages: [], ...overrides }
}

describe('chatUtils', () => {
  it('recorta el título largo del hilo con puntos suspensivos', () => {
    expect(titleFrom('a'.repeat(40))).toBe(`${'a'.repeat(36)}…`)
    expect(titleFrom('corto')).toBe('corto')
  })

  it('envía como máximo los últimos 20 turnos del historial', () => {
    const messages = Array.from({ length: 25 }, (_, index) => createMessage('user', `mensaje ${index}`))

    const history = toHistory(messages)

    expect(history).toHaveLength(maxHistoryTurns)
    expect(history[0]).toEqual({ role: 'user', text: 'mensaje 5' })
  })

  it('pone título al hilo con la primera pregunta', () => {
    const question = createMessage('user', 'Ayúdame con el parcial')

    const updated = withQuestion(thread({ title: 'Nueva conversación' }), question)

    expect(updated.title).toBe('Ayúdame con el parcial')
    expect(updated.messages).toEqual([question])
  })

  it('conserva el título en las preguntas siguientes', () => {
    const first = createMessage('user', 'Primera')
    const second = createMessage('user', 'Segunda')
    const started = withQuestion(thread({ title: 'Nueva conversación' }), first)

    const updated = withQuestion(started, second)

    expect(updated.title).toBe('Primera')
    expect(updated.messages).toHaveLength(2)
  })

  it('busca por título y por texto de los mensajes, sin distinguir mayúsculas', () => {
    const withMessage = thread({ messages: [createMessage('assistant', 'Compra leche y pan')] })

    expect(matchesSearch(withMessage, '  LECHE ')).toBe(true)
    expect(matchesSearch(withMessage, 'historia')).toBe(true)
    expect(matchesSearch(withMessage, 'deporte')).toBe(false)
    expect(matchesSearch(withMessage, '')).toBe(true)
  })

  it('describe el estado del hilo según quién habló último', () => {
    expect(threadStatus(thread())).toBe('Sin mensajes')
    expect(threadStatus(thread({ messages: [createMessage('user', 'hola')] }))).toBe('1 mensajes · esperando respuesta')
    expect(
      threadStatus(thread({ messages: [createMessage('user', 'hola'), createMessage('assistant', 'qué tal')] })),
    ).toBe('2 mensajes · respondido')
  })

  it('detecta si la respuesta cambió alguna tarea', () => {
    expect(hasTaskChanges({ created: [], updated: [], deletedIds: [] })).toBe(false)
    expect(hasTaskChanges({ created: [], updated: [], deletedIds: ['t1'] })).toBe(true)
  })
})
