import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDailySummary, sendChatMessage } from '../api/aiApi'
import { getCategories } from '../api/categoriesApi'
import { getTasks, toggleTaskStatus } from '../api/tasksApi'
import { AuthContext, type AuthContextValue } from '../context/authContext'
import { TaskSyncProvider } from '../context/TaskSyncProvider'
import { ToastProvider } from '../context/ToastProvider'
import type { AiTaskChanges, Task } from '../types/api'
import { ChatPage } from './Chat'
import { Dashboard } from './Dashboard'

vi.mock('../api/tasksApi', () => ({
  getTasks: vi.fn(),
  toggleTaskStatus: vi.fn(),
}))
vi.mock('../api/aiApi', () => ({
  sendChatMessage: vi.fn(),
  getDailySummary: vi.fn(),
}))
vi.mock('../api/categoriesApi', () => ({ getCategories: vi.fn() }))

const auth: AuthContextValue = {
  token: 'jwt',
  user: { id: 'u1', email: 'ana@example.com' },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
}

function makeTask(id: string, title: string): Task {
  return { id, title, description: null, status: 'PENDING', priority: 'MEDIUM', dueDate: null, categoryId: null, category: null }
}

// Simula el backend: la lista de tareas vive aquí y el chat la modifica igual que lo haría la API.
function fakeBackend(initial: Task[]) {
  let tasks = initial

  vi.mocked(getTasks).mockImplementation(async () => tasks)

  return {
    replyWith(reply: string, changes: Partial<AiTaskChanges>, nextTasks: Task[]) {
      vi.mocked(sendChatMessage).mockImplementationOnce(async () => {
        tasks = nextTasks
        return { reply, changes: { created: [], updated: [], deletedIds: [], ...changes } }
      })
    },
  }
}

function renderWorkspace() {
  render(
    <AuthContext value={auth}>
      <MemoryRouter>
        <ToastProvider>
          <TaskSyncProvider>
            <Dashboard />
            <ChatPage />
          </TaskSyncProvider>
        </ToastProvider>
      </MemoryRouter>
    </AuthContext>,
  )

  return { user: userEvent.setup(), list: () => screen.findByRole('list', { name: 'Lista de tareas' }) }
}

async function askAssistant(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByRole('textbox', { name: 'Mensaje para TaskMate AI' }), text)
  await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
}

describe('sincronización del chat con el Dashboard', () => {
  beforeEach(() => {
    vi.mocked(getDailySummary).mockResolvedValue('Resumen de prueba')
    vi.mocked(getCategories).mockResolvedValue([])
    vi.mocked(toggleTaskStatus).mockResolvedValue(makeTask('x', 'x'))
  })

  it('muestra en el Dashboard la tarea que el asistente creó, sin recargar la página', async () => {
    const backend = fakeBackend([])
    const created = makeTask('new-1', 'Comprar leche')
    backend.replyWith('Listo, creé la tarea.', { created: [created] }, [created])
    const { user, list } = renderWorkspace()
    expect((await screen.findAllByText('Aún no tienes tareas.')).length).toBeGreaterThan(0)

    await askAssistant(user, 'crear tarea Comprar leche')

    expect(await within(await list()).findByText('Comprar leche')).toBeInTheDocument()
    expect(sendChatMessage).toHaveBeenCalledWith('crear tarea Comprar leche', [])
    expect(await screen.findByText('Tus tareas se actualizaron desde el chat.')).toBeInTheDocument()
  })

  it('quita del Dashboard la tarea que el asistente eliminó', async () => {
    const backend = fakeBackend([makeTask('t1', 'Entregar TP')])
    backend.replyWith('Eliminada.', { deletedIds: ['t1'] }, [])
    const { user, list } = renderWorkspace()
    expect(within(await list()).getByText('Entregar TP')).toBeInTheDocument()

    await askAssistant(user, 'borra Entregar TP')

    expect((await screen.findAllByText('Aún no tienes tareas.')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Entregar TP')).not.toBeInTheDocument()
  })

  it('refleja en el Dashboard los cambios de título que hizo el asistente', async () => {
    const backend = fakeBackend([makeTask('t1', 'Entregar TP')])
    const renamed = makeTask('t1', 'Entregar TP final')
    backend.replyWith('Actualizada.', { updated: [renamed] }, [renamed])
    const { user, list } = renderWorkspace()
    await list()

    await askAssistant(user, 'cambia el título de Entregar TP a Entregar TP final')

    expect(await within(await list()).findByText('Entregar TP final')).toBeInTheDocument()
    expect(screen.queryByText('Entregar TP')).not.toBeInTheDocument()
  })

  it('no vuelve a pedir las tareas cuando la respuesta no cambió ninguna', async () => {
    const backend = fakeBackend([makeTask('t1', 'Entregar TP')])
    backend.replyWith('Te recomiendo empezar por el resumen.', {}, [makeTask('t1', 'Entregar TP')])
    const { user, list } = renderWorkspace()
    await list()
    const callsBefore = vi.mocked(getTasks).mock.calls.length

    await askAssistant(user, 'qué me conviene hacer primero')

    expect(await screen.findByText('Te recomiendo empezar por el resumen.')).toBeInTheDocument()
    expect(vi.mocked(getTasks).mock.calls.length).toBe(callsBefore)
    expect(screen.queryByText('Tus tareas se actualizaron desde el chat.')).not.toBeInTheDocument()
  })
})
