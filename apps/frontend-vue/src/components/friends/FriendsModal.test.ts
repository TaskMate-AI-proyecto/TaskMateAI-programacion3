import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFriendRequests, getFriends, getMe, respondToFriendRequest, searchUsers, sendFriendRequest } from '../../api/friendsApi'
import FriendsModal from './FriendsModal.vue'

vi.mock('../../api/friendsApi', () => ({
  getMe: vi.fn(),
  getFriends: vi.fn(),
  getFriendRequests: vi.fn(),
  searchUsers: vi.fn(),
  sendFriendRequest: vi.fn(),
  respondToFriendRequest: vi.fn(),
}))

async function renderModal() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(FriendsModal, { global: { plugins: [pinia] } })
  await flushPromises()

  return wrapper
}

function buttonWithText(wrapper: VueWrapper, text: string) {
  return wrapper.findAll('button').find((button) => button.text().includes(text))
}

describe('FriendsModal', () => {
  beforeEach(() => {
    vi.mocked(getMe).mockResolvedValue({ id: 'user-1', email: 'ana@example.com', uniqueTag: '@ana_8f9a2c' })
    vi.mocked(getFriends).mockResolvedValue([])
    vi.mocked(getFriendRequests).mockResolvedValue([])
    vi.mocked(searchUsers).mockReset()
    vi.mocked(sendFriendRequest).mockReset()
    vi.mocked(respondToFriendRequest).mockReset()
  })

  it('muestra el nivel y la racha de cada amigo junto a su identificador', async () => {
    vi.mocked(getFriends).mockResolvedValue([
      {
        friendshipId: 'f1',
        friend: { id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc', level: 3, currentStreak: 4 },
        since: '2026-11-01T00:00:00.000Z',
      },
    ])
    const wrapper = await renderModal()

    const row = wrapper.findAll('li').find((item) => item.text().includes('@bob_123abc'))
    expect(row?.text()).toContain('Nvl 3')
    expect(row?.text()).toContain('4')
  })

  it('muestra mi identificador y lo copia con un clic', async () => {
    const wrapper = await renderModal()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    expect(wrapper.text()).toContain('@ana_8f9a2c')
    await buttonWithText(wrapper, 'Copiar')?.trigger('click')

    expect(writeText).toHaveBeenCalledWith('@ana_8f9a2c')
  })

  it('busca por identificador y envía una solicitud a quien no es amigo', async () => {
    vi.mocked(searchUsers).mockResolvedValue([{ id: 'user-2', uniqueTag: '@bob_123abc', relation: 'none' }])
    vi.mocked(sendFriendRequest).mockResolvedValue(undefined)
    const wrapper = await renderModal()

    await wrapper.get('input[aria-label="Identificador a buscar"]').setValue('bob')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await buttonWithText(wrapper, 'Enviar solicitud')?.trigger('click')
    await flushPromises()

    expect(searchUsers).toHaveBeenCalledWith('bob')
    expect(sendFriendRequest).toHaveBeenCalledWith('@bob_123abc')
    expect(wrapper.text()).toContain('Solicitud enviada')
  })

  it('muestra los días que quedan a una solicitud recibida y permite aceptarla', async () => {
    vi.mocked(getFriendRequests).mockResolvedValue([
      {
        id: 'req-1',
        direction: 'incoming',
        user: { id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' },
        createdAt: '2026-11-01T00:00:00.000Z',
        expiresAt: '2026-12-01T00:00:00.000Z',
        daysLeft: 20,
      },
    ])
    vi.mocked(respondToFriendRequest).mockResolvedValue(undefined)
    const wrapper = await renderModal()

    expect(wrapper.text()).toContain('Caduca en 20 días')
    await buttonWithText(wrapper, 'Aceptar')?.trigger('click')

    expect(respondToFriendRequest).toHaveBeenCalledWith('req-1', 'accept')
  })
})
