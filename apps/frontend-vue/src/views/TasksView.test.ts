import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCategories } from '../api/categoriesApi'
import { createTask, deleteTask, getTasks, toggleTaskStatus } from '../api/tasksApi'
import type { Task } from '../types/api'
import TasksView from './TasksView.vue'

// Las vistas leen la ruta para los enlaces de la paleta: basta un router en memoria con una ruta comodín.
function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
}

vi.mock('../api/tasksApi', () => ({
  getTasks: vi.fn(),
  getTaskById: vi.fn(),
  toggleTaskStatus: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))
vi.mock('../api/categoriesApi', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))
vi.mock('../api/aiApi', () => ({ generateSubtasks: vi.fn(), getDailySummary: vi.fn() }))

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return { description: null, status: 'PENDING', priority: 'MEDIUM', dueDate: null, categoryId: null, category: null, ...overrides }
}

function mountView() {
  return mount(TasksView, { global: { plugins: [makeRouter()] } })
}

function buttonWithText(wrapper: ReturnType<typeof mountView>, text: string) {
  return wrapper.findAll('button').find((button) => button.text() === text)
}

describe('TasksView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getCategories).mockResolvedValue([])
  })

  it('muestra estado, prioridad y vencimiento de cada tarea', async () => {
    vi.mocked(getTasks).mockResolvedValue([task({ id: '1', title: 'Informe', dueDate: '2000-01-01T00:00:00.000Z', priority: 'HIGH' })])

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Informe')
    expect(wrapper.text()).toContain('Pendiente')
    expect(wrapper.text()).toContain('Prioridad alta')
    expect(wrapper.text()).toContain('Vencida')
  })

  it('filtra por prioridad con el selector', async () => {
    vi.mocked(getTasks).mockResolvedValue([
      task({ id: 'a', title: 'Urgente', priority: 'HIGH' }),
      task({ id: 'b', title: 'Normal', priority: 'MEDIUM' }),
    ])
    const wrapper = mountView()
    await flushPromises()

    const prioritySelect = wrapper.findAll('select')[2]
    await prioritySelect.setValue('HIGH')

    expect(wrapper.text()).toContain('Urgente')
    expect(wrapper.text()).not.toContain('Normal')
  })

  it('muestra el estado vacío y el de "ningún resultado" con filtros activos', async () => {
    vi.mocked(getTasks).mockResolvedValue([])
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Aún no tienes tareas.')

    vi.mocked(getTasks).mockResolvedValue([task({ id: 'a', title: 'Informe' })])
    await wrapper.get('input[type="search"]').setValue('zzz')

    expect(wrapper.text()).toContain('Ninguna tarea coincide con los filtros.')
  })

  it('marca una tarea como completada desde su casilla y actualiza el badge de estado', async () => {
    vi.mocked(getTasks).mockResolvedValue([task({ id: 'a', title: 'Informe' })])
    vi.mocked(toggleTaskStatus).mockResolvedValue(task({ id: 'a', title: 'Informe', status: 'COMPLETED' }))
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('button[aria-label="Marcar como completada"]').trigger('click')
    await flushPromises()

    expect(toggleTaskStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
    expect(wrapper.text()).toContain('Completada')
    expect(wrapper.find('button[aria-label="Marcar como pendiente"]').exists()).toBe(true)
  })

  it('crea una tarea desde la modal y la añade al listado', async () => {
    vi.mocked(getTasks).mockResolvedValue([])
    vi.mocked(createTask).mockResolvedValue(task({ id: 'n', title: 'Comprar pan' }))
    const wrapper = mountView()
    await flushPromises()

    await buttonWithText(wrapper, 'Nueva tarea')?.trigger('click')
    await wrapper.get('input[maxlength="120"]').setValue('Comprar pan')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Comprar pan' }))
    expect(wrapper.text()).toContain('Comprar pan')
    expect(wrapper.find('input[maxlength="120"]').exists()).toBe(false)
  })

  it('elimina una tarea tras confirmar en la modal', async () => {
    vi.mocked(getTasks).mockResolvedValue([task({ id: 'a', title: 'Informe' })])
    vi.mocked(deleteTask).mockResolvedValue(undefined)
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('button[aria-label="Eliminar Informe"]').trigger('click')
    await buttonWithText(wrapper, 'Eliminar')?.trigger('click')
    await flushPromises()

    expect(deleteTask).toHaveBeenCalledWith('a')
    expect(wrapper.text()).not.toContain('Informe')
  })
})
