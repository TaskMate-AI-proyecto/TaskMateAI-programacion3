import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Task } from '../types/api'
import { useTaskDeepLink } from './useTaskDeepLink'

const task: Task = {
  id: 't1',
  title: 'Comprar pan',
  description: null,
  status: 'PENDING',
  priority: 'MEDIUM',
  dueDate: null,
  categoryId: null,
  category: null,
}

function Harness({ tasks, isLoading, openForm }: { tasks: Task[]; isLoading: boolean; openForm: (task: Task | null) => void }) {
  useTaskDeepLink(tasks, isLoading, openForm)
  const location = useLocation()

  return <p data-testid="search">{location.search || 'sin parámetros'}</p>
}

function renderAt(path: string, props: { tasks: Task[]; isLoading: boolean; openForm: (task: Task | null) => void }) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Harness {...props} />} path="*" />
      </Routes>
    </MemoryRouter>,
  )
}

describe('useTaskDeepLink', () => {
  it('abre el formulario de nueva tarea con ?nueva=1 y quita el parámetro', () => {
    const openForm = vi.fn()
    renderAt('/tasks?nueva=1', { tasks: [], isLoading: false, openForm })

    expect(openForm).toHaveBeenCalledWith(null)
    expect(screen.getByTestId('search')).toHaveTextContent('sin parámetros')
  })

  it('abre la tarea indicada con ?tarea=<id> cuando el listado está cargado', () => {
    const openForm = vi.fn()
    renderAt('/tasks?tarea=t1', { tasks: [task], isLoading: false, openForm })

    expect(openForm).toHaveBeenCalledWith(task)
  })

  it('espera a que el listado cargue antes de abrir una tarea', () => {
    const openForm = vi.fn()
    renderAt('/tasks?tarea=t1', { tasks: [], isLoading: true, openForm })

    expect(openForm).not.toHaveBeenCalled()
    expect(screen.getByTestId('search')).toHaveTextContent('?tarea=t1')
  })

  it('no abre nada si la tarea ya no existe, pero retira el parámetro', () => {
    const openForm = vi.fn()
    renderAt('/tasks?tarea=desconocida', { tasks: [task], isLoading: false, openForm })

    expect(openForm).not.toHaveBeenCalled()
    expect(screen.getByTestId('search')).toHaveTextContent('sin parámetros')
  })
})
