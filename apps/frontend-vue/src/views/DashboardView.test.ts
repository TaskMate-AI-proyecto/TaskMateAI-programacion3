import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCategories } from '../api/categoriesApi'
import { getTasks } from '../api/tasksApi'
import { useTaskSyncStore } from '../stores/taskSync'
import type { Task } from '../types/api'
import DashboardView from './DashboardView.vue'

vi.mock('../api/tasksApi', () => ({
  getTasks: vi.fn(),
  toggleTaskStatus: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))
vi.mock('../api/categoriesApi', () => ({ getCategories: vi.fn() }))

function task(title: string): Task {
  return { id: title, title, description: null, status: 'PENDING', priority: 'MEDIUM', dueDate: null, categoryId: null, category: null }
}

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getCategories).mockResolvedValue([])
  })

  it('carga las tareas una sola vez al montarse', async () => {
    vi.mocked(getTasks).mockResolvedValue([])

    mount(DashboardView)
    await flushPromises()

    expect(getTasks).toHaveBeenCalledTimes(1)
  })

  it('vuelve a pedir las tareas cuando el asistente cambia alguna, sin recargar la página', async () => {
    vi.mocked(getTasks).mockResolvedValueOnce([]).mockResolvedValueOnce([task('Tarea creada por el chat')])
    const wrapper = mount(DashboardView)
    await flushPromises()
    expect(wrapper.text()).toContain('Aún no tienes tareas.')

    useTaskSyncStore().notifyTasksChanged()
    await flushPromises()

    expect(getTasks).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Tarea creada por el chat')
  })
})
