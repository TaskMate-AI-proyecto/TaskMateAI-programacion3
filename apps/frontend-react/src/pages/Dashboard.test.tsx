import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDailySummary } from '../api/aiApi'
import { getCategories } from '../api/categoriesApi'
import { getTasks, toggleTaskStatus } from '../api/tasksApi'
import { ToastProvider } from '../context/ToastProvider'
import type { Category, Task } from '../types/api'
import { Dashboard } from './Dashboard'

vi.mock('../api/tasksApi', () => ({
  getTasks: vi.fn(),
  toggleTaskStatus: vi.fn(),
}))
vi.mock('../api/aiApi', () => ({ getDailySummary: vi.fn() }))
vi.mock('../api/categoriesApi', () => ({ getCategories: vi.fn() }))

const getTasksMock = vi.mocked(getTasks)
const toggleTaskStatusMock = vi.mocked(toggleTaskStatus)

function makeTask(overrides: Partial<Task> & Pick<Task, 'id' | 'title' | 'priority'>): Task {
  return { description: null, status: 'PENDING', dueDate: null, categoryId: null, category: null, ...overrides }
}

const tasks: Task[] = [
  makeTask({ id: 't1', title: 'Preparar parcial', priority: 'HIGH' }),
  makeTask({ id: 't2', title: 'Comprar víveres', priority: 'MEDIUM' }),
  makeTask({ id: 't3', title: 'Leer apuntes', priority: 'LOW' }),
]

function renderDashboard() {
  render(
    <MemoryRouter>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </MemoryRouter>,
  )

  return { user: userEvent.setup() }
}

async function getTaskList() {
  return screen.findByRole('list', { name: 'Lista de tareas' })
}

describe('Dashboard tasks', () => {
  beforeEach(() => {
    vi.mocked(getCategories).mockResolvedValue([])
    getTasksMock.mockResolvedValue(tasks)
    vi.mocked(getDailySummary).mockResolvedValue('Resumen de prueba')
  })

  it('renders the tasks returned by the API', async () => {
    renderDashboard()

    const list = await getTaskList()

    expect(within(list).getByText('Preparar parcial')).toBeInTheDocument()
    expect(within(list).getByText('Comprar víveres')).toBeInTheDocument()
    expect(within(list).getByText('Leer apuntes')).toBeInTheDocument()
    expect(getTasksMock).toHaveBeenCalledTimes(1)
  })

  it('filters the list by priority and marks the active chip', async () => {
    const { user } = renderDashboard()
    const list = await getTaskList()

    await user.click(screen.getByRole('button', { name: 'Alta' }))

    expect(within(list).getByText('Preparar parcial')).toBeInTheDocument()
    expect(within(list).queryByText('Comprar víveres')).not.toBeInTheDocument()
    expect(within(list).queryByText('Leer apuntes')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alta' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Baja' }))

    expect(within(list).getByText('Leer apuntes')).toBeInTheDocument()
    expect(within(list).queryByText('Preparar parcial')).not.toBeInTheDocument()
  })

  it('restores every task when the "Todas" filter is selected again', async () => {
    const { user } = renderDashboard()
    const list = await getTaskList()

    await user.click(screen.getByRole('button', { name: 'Media' }))
    await user.click(screen.getByRole('button', { name: 'Todas' }))

    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
  })

  it('explains when no task matches the selected priority', async () => {
    getTasksMock.mockResolvedValue([makeTask({ id: 't1', title: 'Preparar parcial', priority: 'HIGH' })])
    const { user } = renderDashboard()
    await getTaskList()

    await user.click(screen.getByRole('button', { name: 'Baja' }))

    expect(screen.getByText('No hay tareas de prioridad baja.')).toBeInTheDocument()
  })

  it('marks a task as completed through the API and updates the UI', async () => {
    const completed = { ...tasks[0], status: 'COMPLETED' as const }
    toggleTaskStatusMock.mockResolvedValue(completed)
    const { user } = renderDashboard()
    await getTaskList()

    await user.click(screen.getByRole('button', { name: 'Marcar Preparar parcial como completada' }))

    expect(toggleTaskStatusMock).toHaveBeenCalledWith(tasks[0])
    expect(await screen.findByRole('button', { name: 'Marcar Preparar parcial como pendiente' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the task pending and shows the error when the update fails', async () => {
    toggleTaskStatusMock.mockRejectedValue(new Error('network'))
    const { user } = renderDashboard()
    await getTaskList()

    await user.click(screen.getByRole('button', { name: 'Marcar Comprar víveres como completada' }))

    expect(await screen.findByText('No se pudo completar la solicitud.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar Comprar víveres como completada' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps the chosen filter visible after completing a task', async () => {
    toggleTaskStatusMock.mockResolvedValue({ ...tasks[0], status: 'COMPLETED' })
    const { user } = renderDashboard()
    const list = await getTaskList()

    await user.click(screen.getByRole('button', { name: 'Alta' }))
    await user.click(screen.getByRole('button', { name: 'Marcar Preparar parcial como completada' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Marcar Preparar parcial como pendiente' })).toBeInTheDocument())
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Alta' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('muestra la productividad por prioridad y el porcentaje completado', async () => {
    getTasksMock.mockResolvedValue([
      makeTask({ id: 'a', title: 'Hecha', priority: 'HIGH', status: 'COMPLETED' }),
      makeTask({ id: 'b', title: 'Pendiente', priority: 'HIGH' }),
    ])
    renderDashboard()

    expect(await screen.findByText('50% completadas')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Alta: 1 de 2 completadas/ })).toBeInTheDocument()
  })

  it('muestra cada categoría como tile con sus tareas pendientes y enlace a tareas', async () => {
    const categories: Category[] = [{ id: 'c1', name: 'Facultad', color: '#22c55e' }]
    vi.mocked(getCategories).mockResolvedValue(categories)
    getTasksMock.mockResolvedValue([
      makeTask({ id: 'x', title: 'Parcial', priority: 'HIGH', categoryId: 'c1' }),
      makeTask({ id: 'y', title: 'Estudio', priority: 'LOW', categoryId: 'c1', status: 'COMPLETED' }),
    ])
    renderDashboard()

    const tile = await screen.findByRole('link', { name: /Facultad/ })
    expect(tile).toHaveAttribute('href', '/tasks')
    expect(within(tile).getByText('1 pendientes')).toBeInTheDocument()
  })

  it('invita a crear categorías cuando no hay ninguna', async () => {
    renderDashboard()

    expect(await screen.findByText('Aún no tienes categorías. Créalas desde Tareas.')).toBeInTheDocument()
  })

  it('avisa si no se pueden cargar las categorías sin ocultar el resto del dashboard', async () => {
    vi.mocked(getCategories).mockRejectedValue(new Error('caído'))
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las categorías.')
    expect(screen.getByRole('list', { name: 'Lista de tareas' })).toBeInTheDocument()
  })
})
