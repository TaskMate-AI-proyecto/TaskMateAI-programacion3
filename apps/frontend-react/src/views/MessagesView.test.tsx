import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getContacts, getConversation, markConversationRead, sendMessage } from '../api/messagesApi'
import { AuthProvider } from '../context/AuthContext'
import type { DirectMessage, MessageContact } from '../types/api'
import { MessagesView } from './MessagesView'

vi.mock('../api/messagesApi', () => ({
  getContacts: vi.fn(),
  getConversation: vi.fn(),
  sendMessage: vi.fn(),
  markConversationRead: vi.fn(),
}))

const bob: MessageContact = {
  id: 'user-2',
  email: 'bob@example.com',
  unreadCount: 2,
  lastMessage: { content: 'Nos vemos mañana', createdAt: '2026-11-10T11:00:00.000Z', fromMe: false },
}

const incoming: DirectMessage = { id: 'm1', senderId: 'user-2', receiverId: 'user-1', content: 'Hola, ¿todo bien?', readAt: null, createdAt: '2026-11-10T10:00:00.000Z' }

function renderMessages() {
  localStorage.setItem('taskmate.token', 'jwt')
  localStorage.setItem('taskmate.user', JSON.stringify({ id: 'user-1', email: 'ana@example.com' }))
  render(
    <MemoryRouter>
      <AuthProvider>
        <MessagesView />
      </AuthProvider>
    </MemoryRouter>,
  )

  return userEvent.setup()
}

describe('MessagesView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getContacts).mockReset().mockResolvedValue([bob])
    vi.mocked(getConversation).mockReset().mockResolvedValue([incoming])
    vi.mocked(sendMessage).mockReset()
    vi.mocked(markConversationRead).mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra los contactos con el último mensaje y el contador de no leídos', async () => {
    renderMessages()

    const contact = await screen.findByRole('button', { name: /bob@example.com/ })
    expect(within(contact).getByText('Nos vemos mañana')).toBeInTheDocument()
    expect(within(contact).getByLabelText('2 sin leer')).toBeInTheDocument()
    expect(screen.getByText('Selecciona un contacto para empezar a escribir.')).toBeInTheDocument()
  })

  it('abre la conversación, la marca como leída y muestra el historial', async () => {
    const user = renderMessages()

    await user.click(await screen.findByRole('button', { name: /bob@example.com/ }))

    expect(await screen.findByText('Hola, ¿todo bien?')).toBeInTheDocument()
    expect(getConversation).toHaveBeenCalledWith('user-2')
    expect(markConversationRead).toHaveBeenCalledWith('user-2')
  })

  it('envía un mensaje, lo añade a la conversación y limpia la caja', async () => {
    vi.mocked(sendMessage).mockResolvedValue({ id: 'm2', senderId: 'user-1', receiverId: 'user-2', content: 'Hasta mañana', readAt: null, createdAt: '2026-11-10T12:00:00.000Z' })
    const user = renderMessages()
    await user.click(await screen.findByRole('button', { name: /bob@example.com/ }))

    const box = screen.getByLabelText('Mensaje')
    await user.type(box, '  Hasta mañana  ')
    await user.click(screen.getByRole('button', { name: /Enviar/ }))

    expect(sendMessage).toHaveBeenCalledWith('user-2', 'Hasta mañana')
    expect(await screen.findByText('Hasta mañana')).toBeInTheDocument()
    expect(box).toHaveValue('')
  })

  it('el botón Actualizar vuelve a pedir la lista y la conversación abierta sin recargar', async () => {
    const user = renderMessages()
    await user.click(await screen.findByRole('button', { name: /bob@example.com/ }))
    await screen.findByText('Hola, ¿todo bien?')
    const callsBefore = vi.mocked(getContacts).mock.calls.length

    await user.click(screen.getByRole('button', { name: /Actualizar/ }))

    expect(vi.mocked(getContacts).mock.calls.length).toBeGreaterThan(callsBefore)
    expect(getConversation).toHaveBeenCalledWith('user-2')
  })

  it('vuelve a pedir la lista cada 3 segundos mientras la ventana está visible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderMessages()
    await waitFor(() => expect(getContacts).toHaveBeenCalledTimes(1))

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(getContacts).toHaveBeenCalledTimes(2)
  })
})
