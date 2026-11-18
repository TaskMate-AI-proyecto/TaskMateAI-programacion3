import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getFriendRequests,
  getFriends,
  getMe,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
} from '../../api/friendsApi'
import { ToastProvider } from '../../context/ToastProvider'
import { FriendsModal } from './FriendsModal'

vi.mock('../../api/friendsApi', () => ({
  getMe: vi.fn(),
  getFriends: vi.fn(),
  getFriendRequests: vi.fn(),
  searchUsers: vi.fn(),
  sendFriendRequest: vi.fn(),
  respondToFriendRequest: vi.fn(),
}))

function renderModal() {
  render(
    <ToastProvider>
      <FriendsModal onClose={() => undefined} />
    </ToastProvider>,
  )

  return userEvent.setup()
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
    renderModal()

    const row = (await screen.findByText('@bob_123abc')).closest('li') as HTMLElement
    expect(within(row).getByText('Nvl 3')).toBeInTheDocument()
    expect(within(row).getByText('4')).toBeInTheDocument()
  })

  it('muestra mi identificador y lo copia con un clic', async () => {
    const user = renderModal()
    // Después de userEvent.setup(), que instala su propio portapapeles de prueba.
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    expect(await screen.findByText('@ana_8f9a2c')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Copiar/ }))

    expect(writeText).toHaveBeenCalledWith('@ana_8f9a2c')
  })

  it('busca por identificador y envía una solicitud a quien no es amigo', async () => {
    vi.mocked(searchUsers).mockResolvedValue([{ id: 'user-2', uniqueTag: '@bob_123abc', relation: 'none' }])
    vi.mocked(sendFriendRequest).mockResolvedValue(undefined)
    const user = renderModal()

    await user.type(screen.getByLabelText('Identificador a buscar'), 'bob')
    await user.click(screen.getByRole('button', { name: /Buscar/ }))
    const result = await screen.findByText('@bob_123abc')
    await user.click(within(result.closest('li') as HTMLElement).getByRole('button', { name: 'Enviar solicitud' }))

    expect(searchUsers).toHaveBeenCalledWith('bob')
    expect(sendFriendRequest).toHaveBeenCalledWith('@bob_123abc')
    await waitFor(() => expect(within(result.closest('li') as HTMLElement).getByText('Solicitud enviada')).toBeInTheDocument())
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
    const user = renderModal()

    expect(await screen.findByText('Caduca en 20 días')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Aceptar/ }))

    expect(respondToFriendRequest).toHaveBeenCalledWith('req-1', 'accept')
  })

  it('se monta en un portal sobre body y se cierra con Escape o con un clic en el fondo', async () => {
    const onClose = vi.fn()
    const { container } = render(
      <ToastProvider>
        <FriendsModal onClose={onClose} />
      </ToastProvider>,
    )
    const user = userEvent.setup()

    expect(await screen.findByText('@ana_8f9a2c')).toBeInTheDocument()
    const dialog = screen.getByRole('dialog', { name: 'Amigos' })
    // El diálogo no vive dentro del árbol del componente (la barra superior no lo recorta).
    expect(container.contains(dialog)).toBe(false)
    const backdrop = dialog.parentElement as HTMLElement

    fireEvent.mouseDown(dialog)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.mouseDown(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
