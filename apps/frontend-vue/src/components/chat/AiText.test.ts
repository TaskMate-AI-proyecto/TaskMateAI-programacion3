import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AiText from './AiText.vue'

describe('AiText', () => {
  it('muestra la negrita sin asteriscos y separa las listas en ítems', () => {
    const wrapper = mount(AiText, { props: { text: 'Hola **mundo**.\n\n1. Leer\n2. Resumir' } })

    expect(wrapper.find('strong').text()).toBe('mundo')
    expect(wrapper.text()).not.toContain('**')
    expect(wrapper.findAll('ol li')).toHaveLength(2)
    expect(wrapper.findAll('p')).toHaveLength(1)
  })

  it('usa una lista con viñetas para los guiones', () => {
    const wrapper = mount(AiText, { props: { text: '- Uno\n- Dos' } })

    expect(wrapper.findAll('ul li')).toHaveLength(2)
  })
})
