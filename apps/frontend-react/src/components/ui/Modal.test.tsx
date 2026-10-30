import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SmoothScrollContext } from '../../context/smoothScrollContext'
import { Modal } from './Modal'

function renderModal() {
  const onClose = vi.fn()
  const lockScroll = vi.fn()
  const unlockScroll = vi.fn()

  const { unmount } = render(
    <SmoothScrollContext value={{ lockScroll, unlockScroll }}>
      <Modal onClose={onClose} title="Nueva tarea">
        <input aria-label="Título de prueba" />
      </Modal>
    </SmoothScrollContext>,
  )

  return { onClose, lockScroll, unlockScroll, unmount, user: userEvent.setup() }
}

describe('Modal', () => {
  it('opens as a labelled dialog with its content', () => {
    renderModal()

    expect(screen.getByRole('dialog', { name: 'Nueva tarea' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nueva tarea' })).toBeInTheDocument()
    expect(screen.getByLabelText('Título de prueba')).toBeInTheDocument()
  })

  it('closes with the close button', async () => {
    const { onClose, user } = renderModal()

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when Escape is pressed', async () => {
    const { onClose, user } = renderModal()

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop is clicked but not when the dialog content is clicked', async () => {
    const { onClose, user } = renderModal()

    await user.click(screen.getByLabelText('Título de prueba'))
    expect(onClose).not.toHaveBeenCalled()

    await user.pointer({ keys: '[MouseLeft]', target: screen.getByRole('dialog').parentElement! })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('locks the page scroll while open and releases it on unmount', () => {
    const { lockScroll, unlockScroll, unmount } = renderModal()

    expect(lockScroll).toHaveBeenCalledTimes(1)
    expect(unlockScroll).not.toHaveBeenCalled()

    unmount()

    expect(unlockScroll).toHaveBeenCalledTimes(1)
  })
})
