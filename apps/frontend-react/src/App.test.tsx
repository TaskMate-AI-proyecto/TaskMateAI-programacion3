import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { AuthProvider } from './context/AuthContext'

function renderAppAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('rutas de la aplicación', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirige la raíz al acceso', () => {
    renderAppAt('/')

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
  })

  it('muestra el acceso en /login a quien no tiene sesión', () => {
    renderAppAt('/login')

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
  })

  it('muestra el registro en /register', () => {
    renderAppAt('/register')

    expect(screen.getByRole('heading', { name: 'Crea tu espacio.' })).toBeInTheDocument()
  })

  it('envía a /login cuando se intenta entrar a tareas sin sesión', () => {
    renderAppAt('/tasks')

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
  })

  it('protege también el chat con IA', () => {
    renderAppAt('/chat')

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
  })

  it('envía al acceso las rutas desconocidas', () => {
    renderAppAt('/no-existe')

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo.' })).toBeInTheDocument()
  })
})
