import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  })

  it('alterna el tema, sincroniza la clase .dark y persiste la elección', async () => {
    render(<ThemeToggle />)

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('taskmate.theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Cambiar a tema claro' })).toBeTruthy()
  })
})
