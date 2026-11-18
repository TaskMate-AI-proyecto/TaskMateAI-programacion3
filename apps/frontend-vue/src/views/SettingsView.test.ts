import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteTask, getTasks } from '../api/tasksApi'
import { chatStorageKey, settingsStorageKey } from '../settings/settings'
import { useToastStore } from '../stores/toast'
import type { Task } from '../types/api'
import SettingsView from './SettingsView.vue'

vi.mock('../api/tasksApi', () => ({ getTasks: vi.fn(), deleteTask: vi.fn() }))

function task(id: string): Task {
  return { id, title: id, description: null, status: 'PENDING', priority: 'LOW', dueDate: null, categoryId: null, category: null }
}

function renderSettings() {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(SettingsView, { global: { plugins: [pinia] } })
}

function buttonWithText(wrapper: VueWrapper, text: string) {
  return wrapper.findAll('button').find((button) => button.text() === text)
}

async function openTab(wrapper: VueWrapper, name: string) {
  await wrapper.findAll('[role="tab"]').find((tab) => tab.text() === name)?.trigger('click')
}

describe('SettingsView', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('style')
    document.documentElement.classList.remove('dark')
    vi.mocked(getTasks).mockReset()
    vi.mocked(deleteTask).mockReset()
  })

  it('muestra los campos con etiqueta asociada y el acabado de vidrio compartido', async () => {
    const wrapper = renderSettings()

    expect(wrapper.get('label[for="settings-name"]').text()).toBe('Nombre de usuario')
    expect(wrapper.get('#settings-name').classes()).toContain('settings-field')
    expect(wrapper.get('#settings-email').attributes('readonly')).toBeDefined()
    await openTab(wrapper, 'Asistente IA')
    expect(wrapper.get('#settings-instructions').classes()).toContain('settings-textarea')
    expect(wrapper.get('label[for="settings-instructions"]').text()).toBe('Instrucciones personalizadas')
  })

  it('guarda el nombre de usuario en localStorage y lo muestra en el avatar', async () => {
    const wrapper = renderSettings()

    await wrapper.get('input[placeholder="Cómo quieres que te llamemos"]').setValue('Ana')

    expect(JSON.parse(localStorage.getItem(settingsStorageKey) ?? '{}')).toMatchObject({ displayName: 'Ana' })
    expect(wrapper.get('span[aria-hidden]').text()).toBe('A')
  })

  it('cambia la personalidad y guarda las instrucciones del asistente', async () => {
    const wrapper = renderSettings()

    await openTab(wrapper, 'Asistente IA')
    await wrapper.findAll('[role="radio"]').find((radio) => radio.text().includes('Conciso'))?.trigger('click')
    await wrapper.get('textarea').setValue('Responde en tercera persona')

    expect(JSON.parse(localStorage.getItem(settingsStorageKey) ?? '{}')).toMatchObject({
      personality: 'concise',
      customInstructions: 'Responde en tercera persona',
    })
  })

  it('limpia el historial del chat sólo después de confirmar', async () => {
    localStorage.setItem(chatStorageKey, '[{"id":"1"}]')
    const wrapper = renderSettings()

    await openTab(wrapper, 'Asistente IA')
    await buttonWithText(wrapper, 'Limpiar historial')?.trigger('click')
    expect(localStorage.getItem(chatStorageKey)).not.toBeNull()

    await buttonWithText(wrapper, 'Limpiar')?.trigger('click')

    expect(localStorage.getItem(chatStorageKey)).toBeNull()
    expect(useToastStore().toasts.map((toast) => toast.message)).toContain('Historial del chat borrado')
  })

  it('aplica el acento elegido a las variables globales', async () => {
    const wrapper = renderSettings()

    await openTab(wrapper, 'Apariencia')
    await buttonWithText(wrapper, 'Cian')?.trigger('click')

    expect(document.documentElement.style.getPropertyValue('--indigo-500')).toBe('6 182 212')
    expect(JSON.parse(localStorage.getItem(settingsStorageKey) ?? '{}')).toMatchObject({ accent: 'cyan' })
  })

  it('cambia el tema desde la pestaña Apariencia', async () => {
    const wrapper = renderSettings()

    await openTab(wrapper, 'Apariencia')
    await buttonWithText(wrapper, 'Oscuro')?.trigger('click')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('taskmate.theme')).toBe('dark')
  })

  it('exporta las tareas en JSON', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:taskmate')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.mocked(getTasks).mockResolvedValue([task('a')])
    const wrapper = renderSettings()

    await openTab(wrapper, 'Seguridad & Datos')
    await buttonWithText(wrapper, 'JSON')?.trigger('click')
    await flushPromises()

    expect(click).toHaveBeenCalledTimes(1)
    expect(useToastStore().toasts.map((toast) => toast.message)).toContain('Tareas exportadas en JSON')
    vi.restoreAllMocks()
  })

  it('restablece las tareas tras confirmar en la zona de peligro', async () => {
    vi.mocked(getTasks).mockResolvedValue([task('a'), task('b')])
    vi.mocked(deleteTask).mockResolvedValue(undefined)
    const wrapper = renderSettings()

    await openTab(wrapper, 'Seguridad & Datos')
    await buttonWithText(wrapper, 'Restablecer tareas')?.trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="dialog"]').text()).toContain('Se eliminarán 2 tareas. Esta acción no se puede deshacer.')

    await buttonWithText(wrapper, 'Eliminar todo')?.trigger('click')
    await flushPromises()

    expect(deleteTask).toHaveBeenCalledWith('a')
    expect(deleteTask).toHaveBeenCalledWith('b')
  })
})
