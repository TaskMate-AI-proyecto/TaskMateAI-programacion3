import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCategory } from '../../api/categoriesApi'
import CategoryManager from './CategoryManager.vue'

vi.mock('../../api/categoriesApi', () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

describe('CategoryManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('crea una categoría con el nombre recortado y el color elegido', async () => {
    vi.mocked(createCategory).mockResolvedValue({ id: 'c1', name: 'Estudio', color: '#3b82f6' })
    const wrapper = mount(CategoryManager, { props: { categories: [] } })

    await wrapper.get('input[maxlength="40"]').setValue('  Estudio  ')
    await wrapper.get('button[aria-label="Color #3B82F6"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createCategory).toHaveBeenCalledWith({ name: 'Estudio', color: '#3b82f6' })
    expect(wrapper.emitted('changed')).toBeTruthy()
  })

  it('pide confirmación antes de eliminar una categoría', async () => {
    const wrapper = mount(CategoryManager, { props: { categories: [{ id: 'c1', name: 'Trabajo', color: '#EF6F5E' }] } })

    await wrapper.get('button[aria-label="Eliminar Trabajo"]').trigger('click')

    expect(wrapper.text()).toContain('¿Eliminar?')
    expect(wrapper.find('button[aria-label="Editar Trabajo"]').exists()).toBe(false)
  })
})
