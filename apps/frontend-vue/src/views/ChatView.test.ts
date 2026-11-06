import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendChatMessage } from '../api/aiApi'
import { getTasks } from '../api/tasksApi'
import { useAuthStore } from '../stores/auth'
import { useTaskSyncStore } from '../stores/taskSync'
import { useToastStore } from '../stores/toast'
import type { AiTaskChanges, Task } from '../types/api'
import ChatView from './ChatView.vue'

vi.mock('../api/aiApi', () => ({ sendChatMessage: vi.fn() }))
vi.mock('../api/tasksApi', () => ({ getTasks: vi.fn() }))

const noChanges: AiTaskChanges = { created: [], updated: [], deletedIds: [] }

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return { description: null, status: 'PENDING', priority: 'MEDIUM', dueDate: null, categoryId: null, category: null, ...overrides }
}

function mountChat() {
  return mount(ChatView, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

async function ask(wrapper: ReturnType<typeof mountChat>, text: string) {
  await wrapper.find('input[aria-label="Mensaje para TaskMate AI"]').setValue(text)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

function clickChip(wrapper: ReturnType<typeof mountChat>, label: string) {
  const chip = wrapper.findAll('button').find((button) => button.text() === label)

  return chip?.trigger('click')
}

describe('ChatView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(getTasks).mockResolvedValue([])
    vi.mocked(sendChatMessage).mockResolvedValue({ reply: 'Claro, aquí tienes los pasos.', changes: noChanges })
  })

  it('muestra la cabecera en línea y una invitación cuando no hay mensajes', async () => {
    const wrapper = mountChat()
    await flushPromises()

    expect(wrapper.text()).toContain('Online')
    expect(wrapper.text()).toContain('Pregúntame por tus tareas')
  })

  it('envía el mensaje y muestra la respuesta de la IA', async () => {
    const wrapper = mountChat()
    await flushPromises()

    await ask(wrapper, 'Ayúdame con el parcial')

    expect(sendChatMessage).toHaveBeenCalledWith('Ayúdame con el parcial', [])
    const messages = wrapper.find('[aria-label="Mensajes"]').text()
    expect(messages).toContain('Ayúdame con el parcial')
    expect(messages).toContain('Claro, aquí tienes los pasos.')
    expect((wrapper.find('input[aria-label="Mensaje para TaskMate AI"]').element as HTMLInputElement).value).toBe('')
  })

  it('envía como mensaje la sugerencia rápida que se pulsa', async () => {
    const wrapper = mountChat()
    await flushPromises()

    await clickChip(wrapper, 'Resumir pendientes')
    await flushPromises()

    expect(sendChatMessage).toHaveBeenCalledWith('Resume mis tareas pendientes.', [])
  })

  it('indica que la IA escribe y bloquea el envío mientras espera', async () => {
    vi.mocked(sendChatMessage).mockReturnValue(new Promise(() => {}))
    const wrapper = mountChat()
    await flushPromises()

    await wrapper.find('input[aria-label="Mensaje para TaskMate AI"]').setValue('Hola')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('TaskMate AI está escribiendo…')
    expect(wrapper.find('button[aria-label="Enviar mensaje"]').attributes('disabled')).toBeDefined()
  })

  it('muestra en el contexto las tareas pendientes y su workspace', async () => {
    vi.mocked(getTasks).mockResolvedValue([
      task({ id: 'a', title: 'Entregar TP', priority: 'HIGH' }),
      task({ id: 'b', title: 'Comprar', status: 'COMPLETED' }),
      task({ id: 'c', title: 'Leer', priority: 'LOW' }),
    ])
    useAuthStore().setSession({ success: true, token: 'jwt', user: { id: 'u1', email: 'ana@example.com' } })

    const wrapper = mountChat()
    await flushPromises()

    const metrics = wrapper.find('[aria-label="Métricas del contexto"]').text()
    expect(metrics).toContain('Pendientes')
    expect(wrapper.find('section[aria-labelledby="analyzed-title"]').text()).toContain('Entregar TP')
    expect(wrapper.text()).toContain('Workspace de ana@example.com.')
  })

  it('actualiza el contexto cuando el asistente crea una tarea, sin recargar la página', async () => {
    const created = task({ id: 'new-1', title: 'Comprar leche' })
    vi.mocked(getTasks).mockResolvedValueOnce([]).mockResolvedValueOnce([created])
    vi.mocked(sendChatMessage).mockResolvedValue({ reply: 'Listo, la creé.', changes: { ...noChanges, created: [created] } })
    const wrapper = mountChat()
    await flushPromises()
    expect(wrapper.text()).toContain('No hay tareas pendientes para analizar.')

    await ask(wrapper, 'Crea una tarea llamada leche')

    expect(getTasks).toHaveBeenCalledTimes(2)
    expect(wrapper.find('section[aria-labelledby="analyzed-title"]').text()).toContain('Comprar leche')
    expect(useTaskSyncStore().version).toBe(1)
    expect(useToastStore().toasts[0].message).toBe('Tus tareas se actualizaron desde el chat.')
  })

  it('no vuelve a pedir las tareas cuando la respuesta no cambió ninguna', async () => {
    const wrapper = mountChat()
    await flushPromises()

    await ask(wrapper, 'qué me conviene hacer primero')

    expect(getTasks).toHaveBeenCalledTimes(1)
  })

  it('muestra el error como aviso y no agrega respuesta cuando la IA falla', async () => {
    vi.mocked(sendChatMessage).mockRejectedValue(new Error('caído'))
    const wrapper = mountChat()
    await flushPromises()

    await ask(wrapper, 'Hola')

    expect(useToastStore().toasts[0]).toEqual(expect.objectContaining({ kind: 'error' }))
    expect(wrapper.find('[aria-label="Mensajes"]').text()).not.toContain('Claro, aquí tienes los pasos.')
  })
})
