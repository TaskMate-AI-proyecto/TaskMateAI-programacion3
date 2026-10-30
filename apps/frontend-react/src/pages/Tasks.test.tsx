import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateSubtasks } from '../api/aiApi'
import { getCategories } from '../api/categoriesApi'
import { createTask, deleteTask, getTasks, toggleTaskStatus, updateTask } from '../api/tasksApi'
import { ToastProvider } from '../context/ToastProvider'
import type { Task } from '../types/api'
import { Tasks } from './Tasks'

vi.mock('../api/tasksApi', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  toggleTaskStatus: vi.fn(),
}))
vi.mock('../api/categoriesApi', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))
vi.mock('../api/aiApi', () => ({
  generateSubtasks: vi.fn(),
  getDailySummary: vi.fn(),
}))

function makeTask(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    description: null,
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: null,
    categoryId: null,
    category: null,
    ...overrides,
  }
}

const initialTasks = [
  makeTask({ id: 't1', title: 'Preparar parcial', priority: 'HIGH' }),
  makeTask({ id: 't2', title: 'Comprar víveres' }),
]

function renderTasks() {
  render(
    <ToastProvider>
      <Tasks />
    </ToastProvider>,
  )

  return userEvent.setup()
}

async function openNewTaskDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Nueva tarea/ }))

  return screen.getByRole('dialog', { name: 'Nueva tarea' })
}

describe('Tasks CRUD', () => {
  beforeEach(() => {
    vi.mocked(getTasks).mockResolvedValue(initialTasks)
    vi.mocked(getCategories).mockResolvedValue([])
    vi.mocked(generateSubtasks).mockResolvedValue([])
  })

  it('loads the tasks from the API once', async () => {
    renderTasks()

    expect(await screen.findByRole('heading', { name: 'Preparar parcial' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Comprar víveres' })).toBeInTheDocument()
    expect(getTasks).toHaveBeenCalledTimes(1)
  })

  it('opens the create form, disables submit until there is a title, and closes with Escape', async () => {
    const user = renderTasks()
    const dialog = await openNewTaskDialog(user)

    const submit = within(dialog).getByRole('button', { name: 'Crear tarea' })
    expect(submit).toBeDisabled()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Nueva tarea' })).not.toBeInTheDocument()
  })

  it('creates a task through the API and shows it without reloading the list', async () => {
    vi.mocked(createTask).mockResolvedValue(makeTask({ id: 't3', title: 'Entregar TP', priority: 'LOW' }))
    const user = renderTasks()
    const dialog = await openNewTaskDialog(user)

    await user.type(within(dialog).getByLabelText('Título'), '  Entregar TP  ')
    await user.click(within(dialog).getByRole('button', { name: 'Crear tarea' }))

    expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Entregar TP', priority: 'MEDIUM', status: 'PENDING' }))
    expect(await screen.findByRole('heading', { name: 'Entregar TP' })).toBeInTheDocument()
    expect(screen.getByText('Tarea creada')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getTasks).toHaveBeenCalledTimes(1)
  })

  it('keeps the form open and shows an error when the create request fails', async () => {
    vi.mocked(createTask).mockRejectedValue(new Error('network'))
    const user = renderTasks()
    const dialog = await openNewTaskDialog(user)

    await user.type(within(dialog).getByLabelText('Título'), 'Sin conexión')
    await user.click(within(dialog).getByRole('button', { name: 'Crear tarea' }))

    expect(await screen.findByText('No se pudo completar la solicitud.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Nueva tarea' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Sin conexión' })).not.toBeInTheDocument()
  })

  it('edits a task with its current values and updates the row in place', async () => {
    vi.mocked(updateTask).mockResolvedValue(makeTask({ id: 't1', title: 'Preparar examen', priority: 'HIGH' }))
    const user = renderTasks()
    await screen.findByRole('heading', { name: 'Preparar parcial' })

    await user.click(screen.getByRole('button', { name: 'Editar Preparar parcial' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar tarea' })
    const titleInput = within(dialog).getByLabelText('Título')
    expect(titleInput).toHaveValue('Preparar parcial')

    await user.clear(titleInput)
    await user.type(titleInput, 'Preparar examen')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

    expect(updateTask).toHaveBeenCalledWith('t1', expect.objectContaining({ title: 'Preparar examen' }))
    expect(await screen.findByRole('heading', { name: 'Preparar examen' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Preparar parcial' })).not.toBeInTheDocument()
    expect(screen.getByText('Tarea actualizada')).toBeInTheDocument()
  })

  it('asks for confirmation before deleting and does nothing when cancelled', async () => {
    const user = renderTasks()
    await screen.findByRole('heading', { name: 'Comprar víveres' })

    await user.click(screen.getByRole('button', { name: 'Eliminar Comprar víveres' }))
    const dialog = screen.getByRole('dialog', { name: 'Eliminar tarea' })
    expect(within(dialog).getByText('Comprar víveres')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deleteTask).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Comprar víveres' })).toBeInTheDocument()
  })

  it('deletes the task after confirmation and removes its row', async () => {
    vi.mocked(deleteTask).mockResolvedValue(undefined)
    const user = renderTasks()
    await screen.findByRole('heading', { name: 'Comprar víveres' })

    await user.click(screen.getByRole('button', { name: 'Eliminar Comprar víveres' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(deleteTask).toHaveBeenCalledWith('t2')
    expect(await screen.findByText('Tarea eliminada')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Comprar víveres' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a loading label in the confirmation while the delete request is pending', async () => {
    vi.mocked(deleteTask).mockReturnValue(new Promise<void>(() => {}))
    const user = renderTasks()
    await screen.findByRole('heading', { name: 'Comprar víveres' })

    await user.click(screen.getByRole('button', { name: 'Eliminar Comprar víveres' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    const pendingButton = await screen.findByRole('button', { name: 'Eliminando...' })
    expect(pendingButton).toBeDisabled()
  })

  it('keeps the task and the dialog when the delete request fails', async () => {
    vi.mocked(deleteTask).mockRejectedValue(new Error('network'))
    const user = renderTasks()
    await screen.findByRole('heading', { name: 'Comprar víveres' })

    await user.click(screen.getByRole('button', { name: 'Eliminar Comprar víveres' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText('No se pudo completar la solicitud.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Eliminar tarea' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Comprar víveres' })).toBeInTheDocument()
  })

  it('toggles completion through the API and updates the row', async () => {
    vi.mocked(toggleTaskStatus).mockResolvedValue(makeTask({ id: 't2', title: 'Comprar víveres', status: 'COMPLETED' }))
    const user = renderTasks()
    const row = (await screen.findByRole('heading', { name: 'Comprar víveres' })).closest('li')!

    await user.click(within(row).getByRole('button', { name: 'Marcar como completada' }))

    expect(await within(row).findByRole('button', { name: 'Marcar como pendiente' })).toBeInTheDocument()
    expect(toggleTaskStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 't2' }))
  })
})
