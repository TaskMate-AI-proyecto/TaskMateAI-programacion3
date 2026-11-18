import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFriends } from '../../api/friendsApi'
import { getTasks, toggleTaskStatus } from '../../api/tasksApi'
import { type PaletteEntry } from '../../command-palette/paletteEntries'
import type { Friend, Task } from '../../types/api'
import CommandPalette from './CommandPalette.vue'

vi.mock('../../api/tasksApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/tasksApi')>()),
  getTasks: vi.fn(),
  toggleTaskStatus: vi.fn(),
}))

vi.mock('../../api/friendsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/friendsApi')>()),
  getFriends: vi.fn(),
}))

const pendingTask: Task = {
  id: 't1',
  title: 'Comprar pan',
  description: null,
  status: 'PENDING',
  priority: 'MEDIUM',
  dueDate: null,
  categoryId: null,
  category: null,
}

const friend: Friend = {
  friendshipId: 'f1',
  friend: { id: 'u2', email: 'bea@example.com', uniqueTag: 'bea#1' },
  since: '2026-01-01T00:00:00.000Z',
}

function makeEntries(): PaletteEntry[] {
  return [
    { id: 'nav:ajustes', category: 'Vistas', label: 'Ajustes', shortcut: 'G S', run: vi.fn() },
    { id: 'act:tema', category: 'Acciones', label: 'Alternar tema (Ink Drop)', run: vi.fn() },
  ]
}

async function mountPalette(entries: PaletteEntry[]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  await router.push('/dashboard')

  const wrapper = mount(CommandPalette, {
    props: { entries },
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  await flushPromises()

  return { wrapper, router }
}

function input() {
  return document.querySelector<HTMLInputElement>('input[role="combobox"]') as HTMLInputElement
}

function options() {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
}

function optionByName(name: RegExp) {
  const match = options().find((option) => name.test(option.textContent ?? ''))
  if (!match) throw new Error(`No hay opción que coincida con ${name}`)

  return match
}

function type(text: string) {
  const field = input()
  field.value = text
  field.dispatchEvent(new Event('input'))
}

function press(key: string) {
  input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

describe('CommandPalette (Vue)', () => {
  beforeEach(() => {
    vi.mocked(getTasks).mockResolvedValue([])
    vi.mocked(getFriends).mockResolvedValue([])
    vi.mocked(toggleTaskStatus).mockResolvedValue({ ...pendingTask, status: 'COMPLETED' })
  })

  it('muestra los grupos con sus atajos y cierra con Escape', async () => {
    const { wrapper } = await mountPalette(makeEntries())

    const groups = Array.from(document.querySelectorAll('[role="group"]')).map((group) => group.getAttribute('aria-label'))
    expect(groups).toEqual(['Acciones', 'Vistas'])
    expect(optionByName(/Ajustes/).textContent).toContain('G')

    press('Escape')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('navega con las flechas y ejecuta con Enter cerrando antes', async () => {
    const entries = makeEntries()
    const { wrapper } = await mountPalette(entries)

    press('ArrowDown')
    await flushPromises()
    expect(options()[1].getAttribute('aria-selected')).toBe('true')

    type('ajustes')
    press('Enter')

    expect(entries[0].run).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('indica cuando no hay resultados', async () => {
    const { wrapper } = await mountPalette(makeEntries())

    type('zzzzqq')
    await flushPromises()

    expect(document.body.textContent).toContain('Sin resultados para «zzzzqq»')
    wrapper.unmount()
  })

  it('abre una tarea existente pasando su id en la URL', async () => {
    vi.mocked(getTasks).mockResolvedValue([pendingTask])
    const { wrapper, router } = await mountPalette(makeEntries())

    type('comprar')
    await flushPromises()
    optionByName(/Abrir: Comprar pan/).click()
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/tasks?tarea=t1')
    wrapper.unmount()
  })

  it('completa una tarea desde la paleta', async () => {
    vi.mocked(getTasks).mockResolvedValue([pendingTask])
    const { wrapper } = await mountPalette(makeEntries())

    type('completar comprar')
    await flushPromises()
    optionByName(/^Completar: Comprar pan$/).click()
    await flushPromises()

    expect(toggleTaskStatus).toHaveBeenCalledWith(pendingTask)
    wrapper.unmount()
  })

  it('inicia una conversación directa con un amigo por su identificador', async () => {
    vi.mocked(getFriends).mockResolvedValue([friend])
    const { wrapper, router } = await mountPalette(makeEntries())

    type('bea')
    await flushPromises()
    optionByName(/Mensaje a bea#1/).click()
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/messages?contacto=u2')
    wrapper.unmount()
  })
})
