import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFriends } from '../../api/friendsApi'
import { createWorkspace, getWorkspaces } from '../../api/workspacesApi'
import WorkspaceModal from './WorkspaceModal.vue'

vi.mock('../../api/friendsApi', () => ({ getFriends: vi.fn() }))
vi.mock('../../api/workspacesApi', () => ({ createWorkspace: vi.fn(), addWorkspaceMembers: vi.fn(), getWorkspaces: vi.fn() }))

describe('WorkspaceModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getFriends).mockResolvedValue([
      { friendshipId: 'f1', friend: { id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' }, since: '2026-11-01T00:00:00.000Z' },
    ])
    vi.mocked(getWorkspaces).mockResolvedValue([])
  })

  it('crea un espacio con el amigo marcado y lo selecciona', async () => {
    vi.mocked(createWorkspace).mockResolvedValue({ id: 'ws-1' } as Awaited<ReturnType<typeof createWorkspace>>)
    const wrapper = mount(WorkspaceModal, { attachTo: document.body })
    await flushPromises()

    const nameInput = document.body.querySelector<HTMLInputElement>('input[aria-label="Nombre del espacio"]')
    const friendInput = document.body.querySelector<HTMLInputElement>('input[type="checkbox"]')
    const form = document.body.querySelector('form')
    if (!nameInput || !friendInput || !form) throw new Error('No se encontró el formulario teletransportado')

    nameInput.value = 'Proyecto final'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    friendInput.checked = true
    friendInput.dispatchEvent(new Event('change', { bubbles: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(createWorkspace).toHaveBeenCalledWith(expect.objectContaining({ name: 'Proyecto final', memberIds: ['user-2'] }))
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('no crea nada sin nombre', async () => {
    const wrapper = mount(WorkspaceModal, { attachTo: document.body })
    await flushPromises()

    const submitButton = document.body.querySelector<HTMLButtonElement>('button[type="submit"]')
    const form = document.body.querySelector('form')
    if (!submitButton || !form) throw new Error('No se encontró el formulario teletransportado')

    expect(submitButton.disabled).toBe(true)
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(createWorkspace).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
