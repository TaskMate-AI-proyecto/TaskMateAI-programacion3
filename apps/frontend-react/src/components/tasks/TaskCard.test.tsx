import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Task } from '../../types/api'
import { TaskCard } from './TaskCard'

const baseTask: Task = {
  id: 'task-1',
  title: 'Preparar parcial',
  description: 'Repasar unidades 1 a 3',
  status: 'PENDING',
  priority: 'HIGH',
  dueDate: null,
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Facultad', color: '#22c55e' },
}

function renderCard(task: Partial<Task> = {}, isBusy = false) {
  const handlers = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }
  const fullTask = { ...baseTask, ...task }

  render(<TaskCard isBusy={isBusy} task={fullTask} {...handlers} />)

  return { ...handlers, task: fullTask, user: userEvent.setup() }
}

describe('TaskCard', () => {
  it('muestra título, descripción, estado, prioridad y categoría', () => {
    renderCard()

    expect(screen.getByRole('heading', { name: 'Preparar parcial' })).toBeInTheDocument()
    expect(screen.getByText('Repasar unidades 1 a 3')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Prioridad alta')).toBeInTheDocument()
    expect(screen.getByText('Facultad')).toBeInTheDocument()
  })

  it('marca como vencida una tarea pendiente con fecha pasada', () => {
    renderCard({ dueDate: '2020-01-15T00:00:00.000Z' })

    expect(screen.getByText(/Vencida/)).toBeInTheDocument()
  })

  it('no marca como vencida una tarea completada', () => {
    renderCard({ dueDate: '2020-01-15T00:00:00.000Z', status: 'COMPLETED' })

    expect(screen.queryByText(/Vencida/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar como pendiente' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('notifica el cambio de estado y la edición', async () => {
    const { onToggle, onEdit, task, user } = renderCard()

    await user.click(screen.getByRole('button', { name: 'Marcar como completada' }))
    await user.click(screen.getByRole('button', { name: 'Editar Preparar parcial' }))

    expect(onToggle).toHaveBeenCalledWith(task)
    expect(onEdit).toHaveBeenCalledWith(task)
  })

  it('delega la eliminación al padre, que muestra la confirmación en un modal', async () => {
    const { onDelete, task, user } = renderCard()

    await user.click(screen.getByRole('button', { name: 'Eliminar Preparar parcial' }))

    expect(onDelete).toHaveBeenCalledWith(task)
    expect(screen.queryByText('¿Eliminar?')).not.toBeInTheDocument()
  })

  it('deshabilita las acciones mientras está ocupada', () => {
    renderCard({}, true)

    expect(screen.getByRole('button', { name: 'Marcar como completada' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Editar Preparar parcial' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Eliminar Preparar parcial' })).toBeDisabled()
  })
})
