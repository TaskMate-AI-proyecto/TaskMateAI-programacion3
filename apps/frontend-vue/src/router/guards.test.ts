import { createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../stores/auth'
import { createAppRouter } from './index'
import { resolveAuthRedirect } from './guards'

const session = { success: true as const, token: 'jwt', user: { id: 'u1', email: 'ana@example.com' } }

describe('resolveAuthRedirect', () => {
  it('manda a /login a quien necesita sesión y no la tiene', () => {
    expect(resolveAuthRedirect({ requiresAuth: true }, false)).toBe('/login')
  })

  it('deja pasar a quien necesita sesión y la tiene', () => {
    expect(resolveAuthRedirect({ requiresAuth: true }, true)).toBeNull()
  })

  it('manda al panel a quien ya tiene sesión y entra a una ruta sólo para invitados', () => {
    expect(resolveAuthRedirect({ guestOnly: true }, true)).toBe('/dashboard')
  })

  it('deja pasar a un invitado en rutas sólo para invitados y en rutas públicas', () => {
    expect(resolveAuthRedirect({ guestOnly: true }, false)).toBeNull()
    expect(resolveAuthRedirect({}, false)).toBeNull()
    expect(resolveAuthRedirect({}, true)).toBeNull()
  })
})

describe('guardas de navegación del router', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  async function navigate(path: string) {
    const router = createAppRouter(createMemoryHistory())
    await router.push(path)
    await router.isReady()

    return router.currentRoute.value.path
  }

  it('protege el panel: sin sesión se va a /login', async () => {
    expect(await navigate('/dashboard')).toBe('/login')
  })

  it('deja entrar al panel con sesión iniciada', async () => {
    useAuthStore().setSession(session)

    expect(await navigate('/dashboard')).toBe('/dashboard')
  })

  it('no muestra el login a quien ya tiene sesión', async () => {
    useAuthStore().setSession(session)

    expect(await navigate('/login')).toBe('/dashboard')
    expect(await navigate('/register')).toBe('/dashboard')
  })

  it('redirige la raíz y las rutas desconocidas al login', async () => {
    expect(await navigate('/')).toBe('/login')
    expect(await navigate('/no-existe')).toBe('/login')
  })

  it('permite el registro a quien no tiene sesión', async () => {
    expect(await navigate('/register')).toBe('/register')
  })
})
