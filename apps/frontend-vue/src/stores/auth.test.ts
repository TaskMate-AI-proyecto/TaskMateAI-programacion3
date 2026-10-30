import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { tokenKey, useAuthStore, userKey } from './auth'

const session = { success: true as const, token: 'jwt-token', user: { id: 'u1', email: 'ana@example.com' } }

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('arranca sin sesión cuando no hay nada guardado', () => {
    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.token).toBeNull()
    expect(auth.user).toBeNull()
  })

  it('guarda el token y el usuario al iniciar sesión', () => {
    const auth = useAuthStore()

    auth.setSession(session)

    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem(tokenKey)).toBe('jwt-token')
    expect(JSON.parse(localStorage.getItem(userKey) ?? 'null')).toEqual(session.user)
  })

  it('restaura la sesión guardada al crear de nuevo el store', () => {
    localStorage.setItem(tokenKey, 'jwt-guardado')
    localStorage.setItem(userKey, JSON.stringify(session.user))

    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual(session.user)
  })

  it('ignora un usuario guardado que no tiene la forma esperada', () => {
    localStorage.setItem(tokenKey, 'jwt-guardado')
    localStorage.setItem(userKey, JSON.stringify({ id: 42 }))

    expect(useAuthStore().user).toBeNull()
  })

  it('ignora un usuario guardado que no es JSON válido', () => {
    localStorage.setItem(tokenKey, 'jwt-guardado')
    localStorage.setItem(userKey, '{no-json')

    expect(useAuthStore().user).toBeNull()
  })

  it('borra la sesión y el almacenamiento al cerrarla', () => {
    const auth = useAuthStore()
    auth.setSession(session)

    auth.clearSession()

    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem(tokenKey)).toBeNull()
    expect(localStorage.getItem(userKey)).toBeNull()
  })
})
