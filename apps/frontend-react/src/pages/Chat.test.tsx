import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendChatMessage } from '../api/aiApi'
import { getTasks } from '../api/tasksApi'
import { AuthContext, type AuthContextValue } from '../context/authContext'
import { ToastProvider } from '../context/ToastProvider'
import type { Task } from '../types/api'
import { ChatPage } from './Chat'

vi.mock('../api/aiApi', () => ({ sendChatMessage: vi.fn(), getDailySummary: vi.fn() }))
vi.mock('../api/tasksApi', () => ({ getTasks: vi.fn() }))

const storageKey = 'taskmate.chat-threads'
const noChanges = { created: [], updated: [], deletedIds: [] }

const auth: AuthContextValue = {
  token: 'jwt',
  user: { id: 'u1', email: 'ana@example.com' },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
}

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return { description: null, status: 'PENDING', priority: 'MEDIUM', dueDate: null, categoryId: null, category: null, ...overrides }
}

function renderChat() {
  render(
    <AuthContext value={auth}>
      <MemoryRouter>
        <ToastProvider>
          <ChatPage />
        </ToastProvider>
      </MemoryRouter>
    </AuthContext>,
  )

  return userEvent.setup()
}

function composer() {
  return screen.getByRole('textbox', { name: 'Mensaje para TaskMate AI' })
}

async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(composer(), text)
  await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
}

describe('Chat con IA', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getTasks).mockResolvedValue([])
    vi.mocked(sendChatMessage).mockResolvedValue({ reply: 'Claro, aquí tienes los pasos.', changes: noChanges })
  })

  it('muestra la cabecera de TaskMate AI en línea y una invitación cuando no hay mensajes', () => {
    renderChat()

    const conversation = screen.getByRole('region', { name: 'Conversación con TaskMate AI' })
    expect(within(conversation).getByText('TaskMate AI')).toBeInTheDocument()
    expect(within(conversation).getByText('Online')).toBeInTheDocument()
    expect(screen.getByText(/Pregúntame por tus tareas/)).toBeInTheDocument()
  })

  it('envía un mensaje, muestra la respuesta y titula el hilo con la pregunta', async () => {
    const user = renderChat()

    await ask(user, 'Ayúdame con el parcial')

    expect(sendChatMessage).toHaveBeenCalledWith('Ayúdame con el parcial', [])
    const messages = await screen.findByRole('list', { name: 'Mensajes' })
    expect(within(messages).getByText('Ayúdame con el parcial')).toBeInTheDocument()
    expect(await within(messages).findByText('Claro, aquí tienes los pasos.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ayúdame con el parcial.*respondido/ })).toHaveAttribute('aria-current', 'true')
    expect(composer()).toHaveValue('')
  })

  it('envía el historial de la conversación en el siguiente mensaje', async () => {
    const user = renderChat()

    await ask(user, 'Primera')
    await screen.findByText('Claro, aquí tienes los pasos.')
    await ask(user, 'Segunda')

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2))
    expect(vi.mocked(sendChatMessage).mock.calls[1][1]).toEqual([
      { role: 'user', text: 'Primera' },
      { role: 'assistant', text: 'Claro, aquí tienes los pasos.' },
    ])
  })

  it('envía las sugerencias rápidas como mensajes', async () => {
    const user = renderChat()

    await user.click(screen.getByRole('button', { name: 'Resumir pendientes' }))

    expect(sendChatMessage).toHaveBeenCalledWith('Resume mis tareas pendientes.', [])
  })

  it('no envía mensajes vacíos y deshabilita el botón de envío', async () => {
    const user = renderChat()

    expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled()

    await user.type(composer(), '   {Enter}')

    expect(sendChatMessage).not.toHaveBeenCalled()
  })

  it('muestra el error y no agrega respuesta cuando la IA falla', async () => {
    vi.mocked(sendChatMessage).mockRejectedValue(new Error('caído'))
    const user = renderChat()

    await ask(user, 'Hola')

    expect(await screen.findByText('La IA no pudo completar la solicitud. Inténtalo más tarde.')).toBeInTheDocument()
    expect(screen.queryByText('Claro, aquí tienes los pasos.')).not.toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Mensajes' })).getByText('Hola')).toBeInTheDocument()
  })

  it('reutiliza una conversación vacía al pedir una nueva en vez de crear otra', async () => {
    const user = renderChat()

    await user.click(screen.getByRole('button', { name: 'Nueva conversación' }))
    await user.click(screen.getByRole('button', { name: 'Nueva conversación' }))

    expect(screen.getAllByRole('button', { name: /Nueva conversación.*Sin mensajes/ })).toHaveLength(1)
  })

  it('filtra el historial con la búsqueda', async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        { id: 't1', title: 'Parcial de historia', updatedAt: '2026-01-01T00:00:00.000Z', messages: [] },
        { id: 't2', title: 'Compras de la semana', updatedAt: '2026-01-02T00:00:00.000Z', messages: [] },
      ]),
    )
    const user = renderChat()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar conversaciones' }), 'compras')

    expect(screen.getByRole('button', { name: /Compras de la semana/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Parcial de historia/ })).not.toBeInTheDocument()
  })

  it('persiste los hilos en el navegador y los recupera al volver', async () => {
    const user = renderChat()

    await ask(user, 'Recuérdame esto')
    await screen.findByText('Claro, aquí tienes los pasos.')

    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as Array<{ title: string }>
    expect(saved[0].title).toBe('Recuérdame esto')
  })

  it('arranca sin hilos si el almacenamiento guardado está corrupto', () => {
    localStorage.setItem(storageKey, '{no-es-json')

    renderChat()

    expect(screen.getByText(/Pregúntame por tus tareas/)).toBeInTheDocument()
    expect(screen.getByText('No hay conversaciones que coincidan.')).toBeInTheDocument()
  })

  it('muestra en el contexto las tareas pendientes y las de alta prioridad', async () => {
    vi.mocked(getTasks).mockResolvedValue([
      task({ id: 'a', title: 'Entregar TP', priority: 'HIGH' }),
      task({ id: 'b', title: 'Comprar', status: 'COMPLETED' }),
      task({ id: 'c', title: 'Leer', priority: 'LOW' }),
    ])
    renderChat()

    const metrics = await screen.findByRole('group', { name: 'Métricas del contexto' })
    expect(within(metrics).getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Entregar TP/ })).toHaveAttribute('href', '/tasks')
    expect(screen.getByText('Workspace de ana@example.com.')).toBeInTheDocument()
  })

  it('indica cuando no hay tareas pendientes que analizar', async () => {
    renderChat()

    expect(await screen.findByText('No hay tareas pendientes para analizar.')).toBeInTheDocument()
  })
})
