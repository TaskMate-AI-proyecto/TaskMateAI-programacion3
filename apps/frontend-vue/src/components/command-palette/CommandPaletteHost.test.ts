import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFriends } from '../../api/friendsApi'
import { getTasks } from '../../api/tasksApi'
import CommandPaletteHost from './CommandPaletteHost.vue'

vi.mock('../../api/tasksApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/tasksApi')>()),
  getTasks: vi.fn(),
}))

vi.mock('../../api/friendsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/friendsApi')>()),
  getFriends: vi.fn(),
}))

function dispatchKey(init: KeyboardEventInit) {
  window.dispatchEvent(new KeyboardEvent('keydown', init))
}

async function mountHost() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  await router.push('/dashboard')

  const wrapper = mount(CommandPaletteHost, { global: { plugins: [pinia, router] } })
  await flushPromises()

  return { wrapper, router }
}

function paletteDialog() {
  return document.querySelector('[role="dialog"][aria-label="Paleta de comandos"]')
}

describe('CommandPaletteHost (Vue)', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    vi.mocked(getTasks).mockResolvedValue([])
    vi.mocked(getFriends).mockResolvedValue([])
  })

  it('abre y cierra la paleta con Ctrl+K y Cmd+K', async () => {
    const { wrapper } = await mountHost()

    dispatchKey({ key: 'k', ctrlKey: true })
    await flushPromises()
    expect(paletteDialog()).not.toBeNull()

    dispatchKey({ key: 'k', metaKey: true })
    await flushPromises()
    expect(paletteDialog()).toBeNull()

    wrapper.unmount()
  })

  it('responde a g + letra para navegar y a n para crear una tarea', async () => {
    const { wrapper, router } = await mountHost()

    dispatchKey({ key: 'g' })
    dispatchKey({ key: 'm' })
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/messages')

    dispatchKey({ key: 'n' })
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/tasks?nueva=1')

    wrapper.unmount()
  })

  it('ignora los atajos de una letra mientras se escribe en un campo', async () => {
    const { wrapper, router } = await mountHost()
    const field = document.createElement('input')
    document.body.append(field)

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }))
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }))
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/dashboard')
    field.remove()
    wrapper.unmount()
  })
})
