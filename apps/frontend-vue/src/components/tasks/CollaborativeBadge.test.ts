import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CollaborativeBadge from './CollaborativeBadge.vue'

describe('CollaborativeBadge', () => {
  it('no muestra nada si la tarea no tiene colaboradores', () => {
    const wrapper = mount(CollaborativeBadge, { props: { users: [] } })

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('muestra "Colaborativa" con el avatar de cada amigo', () => {
    const wrapper = mount(CollaborativeBadge, {
      props: { users: [{ id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' }] },
    })

    expect(wrapper.text()).toContain('Colaborativa')
    expect(wrapper.text()).toContain('B')
  })
})
