import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCategories } from '../api/categoriesApi'
import { getDailySummary } from '../api/aiApi'
import { getTasks, toggleTaskStatus, updateTask } from '../api/tasksApi'
import { useTaskSyncStore } from '../stores/taskSync'
import { useToastStore } from '../stores/toast'
import type { Task } from '../types/api'
import DashboardView from './DashboardView.vue'

vi.mock('../api/aiApi', () => ({ getDailySummary: vi.fn() }))
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
    vi.mocked(getDailySummary).mockResolvedValue('Hoy tienes tareas pendientes.')
  })

  const mountView = () => mount(DashboardView, { global: { stubs: { RouterLink: RouterLinkStub } } })

  it('muestra el resumen del día y las métricas tras cargar', async () => {
    vi.mocked(getTasks).mockResolvedValue([task('Revisar informe')])

    const wrapper = mountView()
    await flushPromises()

    expect(getDailySummary).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Hoy tienes tareas pendientes.')
    expect(wrapper.text()).toContain('Próximas pendientes')
    expect(wrapper.text()).toContain('Revisar informe')
  })

  it('actualiza los KPI y el porcentaje de productividad al completar una tarea', async () => {
    vi.mocked(getTasks).mockResolvedValue([task('Revisar informe')])
    vi.mocked(toggleTaskStatus).mockResolvedValue({ ...task('Revisar informe'), status: 'COMPLETED' })
    const wrapper = mountView()
    await flushPromises()

    const kpi = (label: string) => wrapper.findAll('article').find((card) => card.text().endsWith(label))?.get('p.font-display').text()
    expect(wrapper.text()).toContain('0% completadas')
    expect(kpi('Pendientes')).toBe('1')
    expect(kpi('Completadas')).toBe('0')

    await wrapper.get('button[aria-label="Marcar Revisar informe como completada"]').trigger('click')
    await flushPromises()

    expect(toggleTaskStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'Revisar informe' }))
    expect(wrapper.text()).toContain('100% completadas')
    expect(kpi('Pendientes')).toBe('0')
    expect(kpi('Completadas')).toBe('1')
  })

  it('carga las tareas una sola vez al montarse', async () => {
    vi.mocked(getTasks).mockResolvedValue([])

    mountView()
    await flushPromises()

    expect(getTasks).toHaveBeenCalledTimes(1)
  })

  it('vuelve a pedir las tareas cuando el asistente cambia alguna, sin recargar la página', async () => {
    vi.mocked(getTasks).mockResolvedValueOnce([]).mockResolvedValueOnce([task('Tarea creada por el chat')])
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('Aún no tienes tareas.')

    useTaskSyncStore().notifyTasksChanged()
    await flushPromises()

    expect(getTasks).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Tarea creada por el chat')
  })
})

describe('DashboardView kanban view', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(getCategories).mockResolvedValue([])
    vi.mocked(getDailySummary).mockResolvedValue('Hoy tienes tareas pendientes.')
  })

  const mountView = () => mount(DashboardView, { global: { stubs: { RouterLink: RouterLinkStub } } })

  it('cambia a Kanban, recuerda la vista y muestra las columnas', async () => {
    vi.mocked(getTasks).mockResolvedValue([task('Revisar informe')])
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === 'Kanban')?.trigger('click')

    expect(wrapper.find('[role="region"][aria-label="Tablero Kanban"]').exists()).toBe(true)
    expect(wrapper.find('ul[aria-label="Lista de tareas"]').exists()).toBe(false)
    expect(window.localStorage.getItem('taskmate_view_mode')).toBe('kanban')
  })

  it('al mover una tarea la guarda en la API y actualiza los KPI de inmediato', async () => {
    vi.mocked(getTasks).mockResolvedValue([task('Revisar informe')])
    vi.mocked(updateTask).mockResolvedValue({ ...task('Revisar informe'), status: 'COMPLETED' })
    window.localStorage.setItem('taskmate_view_mode', 'kanban')
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('select[aria-label="Mover Revisar informe a columna"]').setValue('COMPLETED')
    await flushPromises()

    expect(updateTask).toHaveBeenCalledWith('Revisar informe', { status: 'COMPLETED' })
    const completadas = wrapper.find('section[aria-label="Completadas"]')
    expect(completadas.text()).toContain('Revisar informe')
    expect(wrapper.text()).toContain('100% completadas')
  })

  it('si la API rechaza el cambio, la tarea vuelve a su columna original y se avisa', async () => {
    vi.mocked(getTasks).mockResolvedValue([task('Revisar informe')])
    vi.mocked(updateTask).mockRejectedValue(new Error('sin conexión'))
    window.localStorage.setItem('taskmate_view_mode', 'kanban')
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('select[aria-label="Mover Revisar informe a columna"]').setValue('COMPLETED')
    await flushPromises()

    expect(wrapper.find('section[aria-label="Por Hacer"]').text()).toContain('Revisar informe')
    expect(wrapper.find('section[aria-label="Completadas"]').text()).not.toContain('Revisar informe')
    expect(useToastStore().toasts.some((toast) => toast.kind === 'error')).toBe(true)
  })
})
