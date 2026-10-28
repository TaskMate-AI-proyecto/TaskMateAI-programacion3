import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Welcome } from './Welcome'

describe('Welcome', () => {
  it('renders the hero title and description', () => {
    render(<Welcome />)

    expect(screen.getByRole('heading', { name: 'Interfaz Base' })).toBeInTheDocument()
    expect(screen.getByText(/Base de interfaz premium para TaskMate/i)).toBeInTheDocument()
  })

  it('renders the ping button in its idle state', () => {
    render(<Welcome />)

    expect(screen.getByRole('button', { name: /Simular ping HTTP/i })).toBeInTheDocument()
    expect(screen.getByText('En espera')).toBeInTheDocument()
  })

  it('shows the connecting state while the ping is in flight', async () => {
    const user = userEvent.setup()
    render(<Welcome />)

    await user.click(screen.getByRole('button', { name: /Simular ping HTTP/i }))

    expect(screen.getByText('Conectando…')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows a successful response once the ping resolves', async () => {
    const user = userEvent.setup()
    render(<Welcome />)

    await user.click(screen.getByRole('button', { name: /Simular ping HTTP/i }))

    expect(await screen.findByText('200 OK', {}, { timeout: 2000 })).toBeInTheDocument()
    expect(screen.getByText(/Respuesta recibida/i)).toBeInTheDocument()
  })
})
