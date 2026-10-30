import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../context/authContext'
import { AppShell } from './AppShell'

function renderShell(path: string, overrides: Partial<AuthContextValue> = {}) {
  const logout = vi.fn()
  const value: AuthContextValue = {
    token: 'jwt',
    user: { id: 'u1', email: 'ana@example.com' },
    isLoading: false,
    login: vi.fn(),
    logout,
    ...overrides,
  }

  render(
    <AuthContext value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<p>Contenido del panel</p>} />
            <Route path="/tasks" element={<p>Contenido de tareas</p>} />
            <Route path="/chat" element={<p>Contenido del chat</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )

  return { logout, user: userEvent.setup(), sidebar: screen.getByRole('navigation', { name: 'Navegación principal' }) }
}

describe('AppShell', () => {
  it('muestra la cápsula lateral, la barra en píldora, el correo y la vista activa', () => {
    const { sidebar } = renderShell('/dashboard')

    expect(within(sidebar).getByRole('link', { name: 'Inicio' })).toHaveClass('nav-link-active')
    expect(within(sidebar).getByRole('link', { name: 'Tareas' })).not.toHaveClass('nav-link-active')
    expect(within(sidebar).getByRole('link', { name: 'Chat IA' })).toHaveAttribute('href', '/chat')
    expect(within(sidebar).getByLabelText('Configuración')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('navigation', { name: 'Pestañas principales' })).toBeInTheDocument()
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
    expect(screen.getByText('Contenido del panel')).toBeInTheDocument()
  })

  it('marca como activa la pestaña de la barra superior de la vista actual', () => {
    renderShell('/dashboard')

    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveClass('nav-link-active')
  })

  it('cambia la vista al navegar desde la cápsula lateral', async () => {
    const { sidebar, user } = renderShell('/dashboard')

    await user.click(within(sidebar).getByRole('link', { name: 'Tareas' }))

    expect(screen.getByText('Contenido de tareas')).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Tareas' })).toHaveClass('nav-link-active')
  })

  it('abre el chat con IA desde la barra superior', async () => {
    const { user } = renderShell('/dashboard')

    await user.click(within(screen.getByRole('navigation', { name: 'Pestañas principales' })).getByRole('link', { name: 'Chat IA' }))

    expect(screen.getByText('Contenido del chat')).toBeInTheDocument()
  })

  it('cierra la sesión desde la barra superior', async () => {
    const { logout, user } = renderShell('/dashboard')

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('muestra un texto genérico cuando no hay correo', () => {
    renderShell('/dashboard', { user: null })

    expect(screen.getByText('Espacio personal')).toBeInTheDocument()
  })
})
