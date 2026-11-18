import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFriends } from '../../api/friendsApi'
import { createWorkspace } from '../../api/workspacesApi'
import { ToastProvider } from '../../context/ToastProvider'
import { WorkspaceContext, type WorkspaceContextValue } from '../../context/workspaceContext'
import { WorkspaceModal } from './WorkspaceModal'

vi.mock('../../api/friendsApi', () => ({ getFriends: vi.fn() }))
vi.mock('../../api/workspacesApi', () => ({ createWorkspace: vi.fn(), addWorkspaceMembers: vi.fn() }))

function renderModal(value: WorkspaceContextValue) {
  render(
    <ToastProvider>
      <WorkspaceContext value={value}>
        <WorkspaceModal onClose={vi.fn()} />
      </WorkspaceContext>
    </ToastProvider>,
  )

  return userEvent.setup()
}

describe('WorkspaceModal', () => {
  beforeEach(() => {
    vi.mocked(getFriends).mockResolvedValue([
      { friendshipId: 'f1', friend: { id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' }, since: '2026-11-01T00:00:00.000Z' },
    ])
  })

  it('crea un espacio con los amigos marcados, lo selecciona y recarga la lista', async () => {
    const reload = vi.fn().mockResolvedValue(undefined)
    const select = vi.fn()
    vi.mocked(createWorkspace).mockResolvedValue({ id: 'ws-1' } as Awaited<ReturnType<typeof createWorkspace>>)
    const user = renderModal({ workspaces: [], selectedId: null, select, reload })

    await user.type(screen.getByLabelText('Nombre del espacio'), 'Proyecto final')
    await user.click(await screen.findByRole('checkbox', { name: '@bob_123abc' }))
    await user.click(screen.getByRole('button', { name: 'Crear espacio' }))

    expect(createWorkspace).toHaveBeenCalledWith(expect.objectContaining({ name: 'Proyecto final', memberIds: ['user-2'] }))
    expect(reload).toHaveBeenCalled()
    expect(select).toHaveBeenCalledWith('ws-1')
  })

  it('no crea nada sin nombre', async () => {
    const user = renderModal({ workspaces: [], selectedId: null, select: vi.fn(), reload: vi.fn() })

    expect(screen.getByRole('button', { name: 'Crear espacio' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Crear espacio' }))

    expect(createWorkspace).not.toHaveBeenCalled()
  })
})
