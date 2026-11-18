import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeToggle from './ThemeToggle.vue'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  })

  it('alterna el tema, sincroniza la clase .dark y persiste la elección', async () => {
    const wrapper = mount(ThemeToggle)

    await wrapper.get('button').trigger('click')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('taskmate.theme')).toBe('dark')
    expect(wrapper.get('button').attributes('aria-label')).toBe('Cambiar a tema claro')
  })
})
