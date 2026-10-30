import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../context/authContext'
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute'

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    token: null,
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

function renderAt(path: string, value: AuthContextValue) {
  render(
    <AuthContext value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Panel privado</p>} />
          </Route>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<p>Pantalla de acceso</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )
}

describe('rutas protegidas', () => {
  it('muestra el contenido privado cuando hay sesión', () => {
    renderAt('/dashboard', authValue({ token: 'jwt' }))

    expect(screen.getByText('Panel privado')).toBeInTheDocument()
  })

  it('redirige a /login cuando no hay sesión', () => {
    renderAt('/dashboard', authValue())

    expect(screen.getByText('Pantalla de acceso')).toBeInTheDocument()
    expect(screen.queryByText('Panel privado')).not.toBeInTheDocument()
  })

  it('muestra la comprobación de sesión mientras se carga el estado', () => {
    renderAt('/dashboard', authValue({ isLoading: true, token: 'jwt' }))

    expect(screen.getByText('Comprobando sesión...')).toBeInTheDocument()
  })
})

describe('rutas públicas', () => {
  it('deja ver el acceso a quien no tiene sesión', () => {
    renderAt('/login', authValue())

    expect(screen.getByText('Pantalla de acceso')).toBeInTheDocument()
  })

  it('redirige a /dashboard a quien ya tiene sesión', () => {
    renderAt('/login', authValue({ token: 'jwt' }))

    expect(screen.getByText('Panel privado')).toBeInTheDocument()
  })

  it('muestra la comprobación de sesión mientras se carga el estado', () => {
    renderAt('/login', authValue({ isLoading: true }))

    expect(screen.getByText('Comprobando sesión...')).toBeInTheDocument()
  })
})
