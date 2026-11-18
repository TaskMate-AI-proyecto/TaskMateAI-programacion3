import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Task, TaskStatus } from '../../types/api'
import KanbanBoard from './KanbanBoard.vue'

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

function fire(element: Element, type: string, dataTransfer: object) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })
  element.dispatchEvent(event)
}

const tasks = [
  makeTask({ id: 'task-1', title: 'Estudiar', status: 'PENDING', priority: 'HIGH' }),
  makeTask({ id: 'task-2', title: 'Diseñar', status: 'IN_PROGRESS' }),
  makeTask({ id: 'task-3', title: 'Revisar', status: 'IN_REVIEW' }),
  makeTask({ id: 'task-4', title: 'Entregar', status: 'COMPLETED' }),
]

function mountBoard(boardTasks = tasks, options: { isLoading?: boolean; pendingId?: string | null } = {}) {
  return mount(KanbanBoard, {
    props: { tasks: boardTasks, isLoading: options.isLoading ?? false, pendingId: options.pendingId ?? null },
  })
}

function column(wrapper: ReturnType<typeof mountBoard>, name: string) {
  const found = wrapper.find(`section[aria-label="${name}"]`)
  if (!found.exists()) throw new Error(`No existe la columna ${name}`)

  return found
}

function card(wrapper: ReturnType<typeof mountBoard>, title: string) {
  return wrapper.findAll('li').find((item) => item.text().includes(title))
}

describe('KanbanBoard', () => {
  it('muestra las cuatro columnas con el número de tareas de cada una', () => {
    const wrapper = mountBoard()

    expect(wrapper.find('[role="region"][aria-label="Tablero Kanban"]').exists()).toBe(true)
    expect(column(wrapper, 'Por Hacer').text()).toContain('Estudiar')
    expect(column(wrapper, 'En Progreso').text()).toContain('Diseñar')
    expect(column(wrapper, 'En Revisión').text()).toContain('Revisar')
    expect(column(wrapper, 'Completadas').text()).toContain('Entregar')
    expect(column(wrapper, 'Completadas').get('span.rounded-full').text()).toBe('1')
  })

  it('soltar una tarjeta en otra columna emite el cambio al estado de esa columna', () => {
    const wrapper = mountBoard()
    const transfer = createDataTransfer()
    const source = card(wrapper, 'Estudiar')
    if (!source) throw new Error('Falta la tarjeta Estudiar')

    fire(source.element, 'dragstart', transfer)
    fire(column(wrapper, 'Completadas').element, 'dragover', transfer)
    fire(column(wrapper, 'Completadas').element, 'drop', transfer)

    expect(wrapper.emitted('move')).toEqual([[tasks[0], 'COMPLETED']])
  })

  it('soltar una tarjeta en su misma columna no emite nada', () => {
    const wrapper = mountBoard()
    const transfer = createDataTransfer()
    const source = card(wrapper, 'Estudiar')
    if (!source) throw new Error('Falta la tarjeta Estudiar')

    fire(source.element, 'dragstart', transfer)
    fire(column(wrapper, 'Por Hacer').element, 'drop', transfer)

    expect(wrapper.emitted('move')).toBeUndefined()
  })

  it('el selector de columna de la tarjeta también emite el cambio (táctil y teclado)', async () => {
    const wrapper = mountBoard()

    await wrapper.find('select[aria-label="Mover Revisar a columna"]').setValue('COMPLETED')

    expect(wrapper.emitted('move')).toEqual([[tasks[2], 'COMPLETED']])
  })

  it('muestra prioridad, fecha de vencimiento e iniciales de los colaboradores', () => {
    const wrapper = mountBoard([
      makeTask({
        id: 'task-5',
        title: 'Compartida',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: '2026-11-20T00:00:00.000Z',
        assignedUsers: [{ id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' }],
      }),
    ])

    const compartida = card(wrapper, 'Compartida')

    expect(compartida?.text()).toContain('Alta')
    expect(compartida?.text()).toContain('nov')
    expect(compartida?.text()).toContain('B')
  })

  it('muestra un esqueleto mientras carga', () => {
    const wrapper = mountBoard([], { isLoading: true })

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('marca como ocupada la tarjeta cuyo cambio está guardándose', () => {
    const wrapper = mountBoard(tasks, { pendingId: 'task-1' })

    expect(card(wrapper, 'Estudiar')?.attributes('aria-busy')).toBe('true')
    expect(card(wrapper, 'Diseñar')?.attributes('aria-busy')).toBe('false')
  })

  it('usa el estado de la API al elegir una columna desde el selector', async () => {
    const wrapper = mountBoard()
    const target: TaskStatus = 'IN_PROGRESS'

    await wrapper.find('select[aria-label="Mover Estudiar a columna"]').setValue(target)
    await flushPromises()

    expect(wrapper.emitted('move')).toEqual([[tasks[0], 'IN_PROGRESS']])
  })
})
