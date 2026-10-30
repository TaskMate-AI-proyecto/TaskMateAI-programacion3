import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDelete } from './ConfirmDelete'
import { ErrorPanel } from './ErrorPanel'

describe('ErrorPanel', () => {
  it('muestra el error como alerta y permite reintentar', async () => {
    const onRetry = vi.fn()
    render(<ErrorPanel message="No hay conexión" onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('No hay conexión')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('ConfirmDelete', () => {
  it('confirma o cancela el borrado', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<ConfirmDelete isBusy={false} onCancel={onCancel} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Sí' }))
    await user.click(screen.getByRole('button', { name: 'No' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('bloquea la confirmación mientras el borrado está en curso', () => {
    render(<ConfirmDelete isBusy onCancel={vi.fn()} onConfirm={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Sí' })).toBeDisabled()
  })
})
