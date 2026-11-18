import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Task, TaskStatus } from '../../types/api'
import { KanbanBoard } from './KanbanBoard'

function makeTask(overrides: Partial<Task> & Pick<Task, 'id' | 'title' | 'status'>): Task {
  return { description: null, priority: 'MEDIUM', dueDate: null, categoryId: null, category: null, assignedUsers: [], ...overrides }
}

// DataTransfer no existe en jsdom: este objeto guarda lo que la tarjeta escribe al arrastrarse.
function createDataTransfer() {
  const store = new Map<string, string>()
  const transfer: Pick<DataTransfer, 'setData' | 'getData' | 'effectAllowed' | 'dropEffect'> = {
    effectAllowed: 'none',
    dropEffect: 'none',
    setData: (type, value) => {
      store.set(type, value)
    },
    getData: (type) => store.get(type) ?? '',
  }

  return transfer
}

const tasks = [
  makeTask({ id: 'task-1', title: 'Estudiar', status: 'PENDING', priority: 'HIGH' }),
  makeTask({ id: 'task-2', title: 'Diseñar', status: 'IN_PROGRESS' }),
  makeTask({ id: 'task-3', title: 'Revisar', status: 'IN_REVIEW' }),
  makeTask({ id: 'task-4', title: 'Entregar', status: 'COMPLETED' }),
]

function column(name: string) {
  return screen.getByRole('region', { name })
}

function cardOf(title: string) {
  return screen.getByText(title).closest('li') as HTMLElement
}

function renderBoard(onMove = vi.fn(), boardTasks = tasks, isLoading = false) {
  render(<KanbanBoard isLoading={isLoading} onMove={onMove} pendingId={null} tasks={boardTasks} />)
  return onMove
}

describe('KanbanBoard', () => {
  it('muestra las cuatro columnas con el número de tareas de cada una', () => {
    renderBoard()

    expect(screen.getByRole('region', { name: 'Tablero Kanban' })).toBeInTheDocument()
    expect(within(column('Por Hacer')).getByText('Estudiar')).toBeInTheDocument()
    expect(within(column('En Progreso')).getByText('Diseñar')).toBeInTheDocument()
    expect(within(column('En Revisión')).getByText('Revisar')).toBeInTheDocument()
    expect(within(column('Completadas')).getByText('Entregar')).toBeInTheDocument()
    expect(within(column('Completadas')).getByText('1')).toBeInTheDocument()
  })

  it('soltar una tarjeta en otra columna pide el cambio de estado de esa columna', () => {
    const onMove = renderBoard()
    const dataTransfer = createDataTransfer()

    fireEvent.dragStart(cardOf('Estudiar'), { dataTransfer })
    fireEvent.dragOver(column('Completadas'), { dataTransfer })
    fireEvent.drop(column('Completadas'), { dataTransfer })

    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenCalledWith(tasks[0], 'COMPLETED')
  })

  it('soltar una tarjeta en su misma columna no hace nada', () => {
    const onMove = renderBoard()
    const dataTransfer = createDataTransfer()

    fireEvent.dragStart(cardOf('Estudiar'), { dataTransfer })
    fireEvent.drop(column('Por Hacer'), { dataTransfer })

    expect(onMove).not.toHaveBeenCalled()
  })

  it('el selector de columna de la tarjeta también cambia su estado (táctil y teclado)', async () => {
    const onMove = renderBoard()

    await userEvent.selectOptions(screen.getByLabelText('Mover Revisar a columna'), 'COMPLETED')

    expect(onMove).toHaveBeenCalledWith(tasks[2], 'COMPLETED')
  })

  it('muestra prioridad, fecha de vencimiento e iniciales de los colaboradores', () => {
    renderBoard(vi.fn(), [
      makeTask({
        id: 'task-5',
        title: 'Compartida',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: '2026-11-20T00:00:00.000Z',
        assignedUsers: [{ id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' }],
      }),
    ])

    const card = cardOf('Compartida')

    expect(within(card).getByText('Alta')).toBeInTheDocument()
    expect(within(card).getByText(/nov/)).toBeInTheDocument()
    expect(within(card).getByText('B')).toBeInTheDocument()
  })

  it('muestra un esqueleto mientras carga', () => {
    const { container } = render(<KanbanBoard isLoading onMove={vi.fn()} pendingId={null} tasks={[]} />)

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tablero Kanban' })).not.toBeInTheDocument()
  })

  it('marca como ocupada la tarjeta cuyo cambio está guardándose', () => {
    render(<KanbanBoard isLoading={false} onMove={vi.fn()} pendingId="task-1" tasks={tasks} />)

    expect(cardOf('Estudiar')).toHaveAttribute('aria-busy', 'true')
    expect(cardOf('Diseñar')).not.toHaveAttribute('aria-busy', 'true')
  })

  it('usa el tipo de estado de la API en el selector', async () => {
    const onMove = renderBoard()
    const target: TaskStatus = 'IN_PROGRESS'

    await userEvent.selectOptions(screen.getByLabelText('Mover Estudiar a columna'), target)

    expect(onMove).toHaveBeenCalledWith(tasks[0], 'IN_PROGRESS')
  })
})
