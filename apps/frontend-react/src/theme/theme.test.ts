import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, changeTheme, nextTheme, originOf, resolveTheme, themeStorageKey } from './theme'

function mockSystemDark(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
    mockSystemDark(false)
  })

  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition')
  })

  it('usa la preferencia guardada antes que el sistema', () => {
    localStorage.setItem(themeStorageKey, 'light')
    mockSystemDark(true)

    expect(resolveTheme()).toBe('light')
  })

  it('sigue prefers-color-scheme cuando no hay preferencia guardada o es inválida', () => {
    mockSystemDark(true)
    expect(resolveTheme()).toBe('dark')

    localStorage.setItem(themeStorageKey, 'azul')
    expect(resolveTheme()).toBe('dark')
  })

  it('sin View Transitions aplica la clase, actualiza el estado y persiste de inmediato', () => {
    const commit = vi.fn()

    changeTheme('dark', { x: 10, y: 20 }, commit)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(commit).toHaveBeenCalledWith('dark')
    expect(localStorage.getItem(themeStorageKey)).toBe('dark')
  })

  it('con View Transitions guarda el origen del clic y cambia el tema dentro de la transición', () => {
    const startViewTransition = vi.fn((callback: () => void) => callback())
    Object.assign(document, { startViewTransition })
    const commit = vi.fn()

    changeTheme('dark', { x: 120, y: 48 }, commit)

    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(document.documentElement.style.getPropertyValue('--x')).toBe('120px')
    expect(document.documentElement.style.getPropertyValue('--y')).toBe('48px')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('usa el centro de la pantalla cuando el cambio no viene de un clic', () => {
    expect(originOf(undefined)).toEqual({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    expect(originOf({ clientX: 30, clientY: 40 })).toEqual({ x: 30, y: 40 })
  })

  it('alterna entre claro y oscuro y aplica la clase de forma idempotente', () => {
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('light')

    applyTheme('dark')
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
