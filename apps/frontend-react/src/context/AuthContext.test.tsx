import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from './AuthContext'

function AuthProbe() {
  const { token, user, login, logout } = useAuth()

  return (
    <>
      <p>Token: {token ?? 'ninguno'}</p>
      <p>Usuario: {user?.email ?? 'ninguno'}</p>
      <button onClick={() => login('nuevo-jwt', { id: 'u1', email: 'ana@example.com' })} type="button">Entrar</button>
      <button onClick={logout} type="button">Salir</button>
    </>
  )
}

function renderProvider() {
  render(<AuthProvider><AuthProbe /></AuthProvider>)

  return userEvent.setup()
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restaura la sesión guardada en localStorage', () => {
    localStorage.setItem('taskmate.token', 'jwt-guardado')
    localStorage.setItem('taskmate.user', JSON.stringify({ id: 'u1', email: 'ana@example.com' }))

    renderProvider()

    expect(screen.getByText('Token: jwt-guardado')).toBeInTheDocument()
    expect(screen.getByText('Usuario: ana@example.com')).toBeInTheDocument()
  })

  it('guarda token y usuario al iniciar sesión', async () => {
    const user = renderProvider()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Token: nuevo-jwt')).toBeInTheDocument()
    expect(localStorage.getItem('taskmate.token')).toBe('nuevo-jwt')
    expect(JSON.parse(localStorage.getItem('taskmate.user') ?? 'null')).toEqual({ id: 'u1', email: 'ana@example.com' })
  })

  it('borra la sesión al cerrarla', async () => {
    localStorage.setItem('taskmate.token', 'jwt')
    localStorage.setItem('taskmate.user', JSON.stringify({ id: 'u1', email: 'ana@example.com' }))
    const user = renderProvider()

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Salir' }))
    })

    expect(screen.getByText('Token: ninguno')).toBeInTheDocument()
    expect(localStorage.getItem('taskmate.token')).toBeNull()
    expect(localStorage.getItem('taskmate.user')).toBeNull()
  })
})
