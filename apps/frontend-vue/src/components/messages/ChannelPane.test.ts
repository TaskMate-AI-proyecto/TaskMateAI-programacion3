import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGroupMessages, sendGroupMessage } from '../../api/messagesApi'
import type { Workspace } from '../../types/api'
import ChannelPane from './ChannelPane.vue'

vi.mock('../../api/messagesApi', () => ({ getGroupMessages: vi.fn(), sendGroupMessage: vi.fn() }))

const workspace: Workspace = {
  id: 'ws-1',
  name: 'Proyecto final',
  icon: 'folder',
  color: '#6366F1',
  ownerId: 'user-1',
  createdAt: '2026-11-01T00:00:00.000Z',
  role: 'OWNER',
  shared: false,
  memberCount: 2,
  pendingTasks: 0,
  members: [],
}

describe('ChannelPane', () => {
  beforeEach(() => {
    vi.mocked(getGroupMessages).mockResolvedValue([
      { id: 'm1', senderId: 'user-2', receiverId: null, workspaceId: 'ws-1', content: 'Hola equipo', readAt: null, createdAt: '2026-11-13T10:00:00.000Z', sender: { id: 'user-2', uniqueTag: '@bob_123abc' } },
    ])
  })

  it('muestra el historial del canal con quién escribió', async () => {
    const wrapper = mount(ChannelPane, { props: { workspace, meId: 'user-1' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Hola equipo')
    expect(wrapper.text()).toContain('@bob_123abc')
    expect(getGroupMessages).toHaveBeenCalledWith('ws-1')
  })

  it('envía al canal del espacio y limpia la caja', async () => {
    vi.mocked(sendGroupMessage).mockResolvedValue({ id: 'm2', senderId: 'user-1', receiverId: null, workspaceId: 'ws-1', content: 'Buenas', readAt: null, createdAt: '2026-11-13T10:01:00.000Z' })
    const wrapper = mount(ChannelPane, { props: { workspace, meId: 'user-1' } })
    await flushPromises()

    await wrapper.get('input[aria-label="Mensaje al espacio"]').setValue('Buenas')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(sendGroupMessage).toHaveBeenCalledWith('ws-1', 'Buenas')
    expect(wrapper.text()).toContain('Buenas')
    expect((wrapper.get('input[aria-label="Mensaje al espacio"]').element as HTMLInputElement).value).toBe('')
  })
})
