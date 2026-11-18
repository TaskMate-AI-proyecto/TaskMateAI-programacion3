import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { AuthView } from './AuthView'

function renderAuth(initialSignup: boolean) {
  render(
    <MemoryRouter>
      <AuthProvider>
        <AuthView initialSignup={initialSignup} />
      </AuthProvider>
    </MemoryRouter>,
  )

  return userEvent.setup()
}

// Botón de cambio de modo del panel visible (el panel oculto está inerte).
function activeSwitchButton() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button.text-link')).find((button) => !button.closest('[inert]'))
}

describe('AuthView (verso de login y registro)', () => {
  it('muestra login activo y deja registro inerte', () => {
    renderAuth(false)

    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
    expect(document.querySelector('[inert]')?.textContent).toContain('Crea tu espacio.')
    expect(document.querySelectorAll('.inert')).toHaveLength(1)
  })

  it('arranca en registro cuando la ruta lo pide', () => {
    renderAuth(true)

    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu espacio.' })).toBeInTheDocument()
    expect(document.querySelector('[inert]')?.textContent).toContain('Bienvenido de nuevo.')
  })

  it('al cambiar de modo lanza la hoja hacia la derecha y activa el otro panel', async () => {
    const user = renderAuth(false)

    await user.click(activeSwitchButton() as HTMLButtonElement)

    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu espacio.' })).toBeInTheDocument()
    expect(document.querySelector('[inert]')?.textContent).toContain('Bienvenido de nuevo.')
    expect(document.querySelector('.animate-blade-right')).not.toBeNull()
  })

  it('volver al modo anterior lanza la hoja hacia la izquierda', async () => {
    const user = renderAuth(true)

    await user.click(activeSwitchButton() as HTMLButtonElement)

    expect(document.querySelector('.animate-blade-left')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
  })
})
