import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getContacts, getConversation, markConversationRead, sendMessage } from '../api/messagesApi'
import type { DirectMessage, MessageContact } from '../types/api'
import MessagesView from './MessagesView.vue'

// Las vistas leen la ruta para los enlaces de la paleta: basta un router en memoria con una ruta comodín.
function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
}

vi.mock('../api/messagesApi', () => ({
  getContacts: vi.fn(),
  getConversation: vi.fn(),
  sendMessage: vi.fn(),
  markConversationRead: vi.fn(),
}))

const bob: MessageContact = {
  id: 'user-2',
  email: 'bob@example.com',
  unreadCount: 2,
  lastMessage: { content: 'Nos vemos mañana', createdAt: '2026-11-10T11:00:00.000Z', fromMe: false },
}

const incoming: DirectMessage = { id: 'm1', senderId: 'user-2', receiverId: 'user-1', content: 'Hola, ¿todo bien?', readAt: null, createdAt: '2026-11-10T10:00:00.000Z' }

async function renderMessages() {
  const pinia = createPinia()
  setActivePinia(pinia)
  localStorage.setItem('taskmate.token', 'jwt')
  localStorage.setItem('taskmate.user', JSON.stringify({ id: 'user-1', email: 'ana@example.com' }))
  const wrapper = mount(MessagesView, { global: { plugins: [pinia, makeRouter()] } })
  await flushPromises()

  return wrapper
}

async function openBob(wrapper: VueWrapper) {
  await wrapper.findAll('button').find((button) => button.text().includes('bob@example.com'))?.trigger('click')
  await flushPromises()
}

describe('MessagesView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getContacts).mockReset().mockResolvedValue([bob])
    vi.mocked(getConversation).mockReset().mockResolvedValue([incoming])
    vi.mocked(sendMessage).mockReset()
    vi.mocked(markConversationRead).mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra los contactos con el último mensaje y el contador de no leídos', async () => {
    const wrapper = await renderMessages()

    const contact = wrapper.findAll('button').find((button) => button.text().includes('bob@example.com'))
    expect(contact?.text()).toContain('Nos vemos mañana')
    expect(contact?.find('[aria-label="2 sin leer"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Selecciona un contacto para empezar a escribir.')
  })

  it('abre la conversación, la marca como leída y muestra el historial', async () => {
    const wrapper = await renderMessages()

    await openBob(wrapper)

    expect(wrapper.text()).toContain('Hola, ¿todo bien?')
    expect(getConversation).toHaveBeenCalledWith('user-2')
    expect(markConversationRead).toHaveBeenCalledWith('user-2')
  })

  it('envía un mensaje, lo añade a la conversación y limpia la caja', async () => {
    vi.mocked(sendMessage).mockResolvedValue({ id: 'm2', senderId: 'user-1', receiverId: 'user-2', content: 'Hasta mañana', readAt: null, createdAt: '2026-11-10T12:00:00.000Z' })
    const wrapper = await renderMessages()
    await openBob(wrapper)

    const box = wrapper.get('input[aria-label="Mensaje"]')
    await box.setValue('  Hasta mañana  ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(sendMessage).toHaveBeenCalledWith('user-2', 'Hasta mañana')
    expect(wrapper.text()).toContain('Hasta mañana')
    expect((box.element as HTMLInputElement).value).toBe('')
  })

  it('el botón Actualizar vuelve a pedir la lista y la conversación abierta sin recargar', async () => {
    const wrapper = await renderMessages()
    await openBob(wrapper)
    const callsBefore = vi.mocked(getContacts).mock.calls.length

    await wrapper.findAll('button').find((button) => button.text().includes('Actualizar'))?.trigger('click')
    await flushPromises()

    expect(vi.mocked(getContacts).mock.calls.length).toBeGreaterThan(callsBefore)
    expect(getConversation).toHaveBeenCalledWith('user-2')
  })

  it('vuelve a pedir la lista cada 3 segundos mientras la ventana está visible', async () => {
    vi.useFakeTimers()
    await renderMessages()
    expect(getContacts).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(3000)
    await flushPromises()

    expect(getContacts).toHaveBeenCalledTimes(2)
  })
})
