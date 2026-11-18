import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateSubtasks } from '../../api/aiApi'
import SubtaskGenerator from './SubtaskGenerator.vue'

vi.mock('../../api/aiApi', () => ({ generateSubtasks: vi.fn(), getDailySummary: vi.fn() }))

describe('SubtaskGenerator', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('genera subtareas, las deja editar y emite solo las seleccionadas', async () => {
    vi.mocked(generateSubtasks).mockResolvedValue(['Leer', 'Resumir', 'Repasar'])
    const wrapper = mount(SubtaskGenerator, { props: { taskId: 't1' } })

    await wrapper.findAll('button').find((button) => button.text() === 'Desglosar con IA')?.trigger('click')
    await flushPromises()
    await wrapper.get('input[aria-label="Incluir subtarea 2"]').setValue(false)
    await wrapper.findAll('button').find((button) => button.text().startsWith('Agregar 2'))?.trigger('click')

    expect(generateSubtasks).toHaveBeenCalledWith('t1')
    expect(wrapper.emitted('accept')?.[0]).toEqual([['Leer', 'Repasar']])
  })
})
