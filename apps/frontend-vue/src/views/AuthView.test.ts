import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createAppRouter } from '../router'
import AuthView from './AuthView.vue'

async function renderAuth(initialSignup: boolean) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push(initialSignup ? '/register' : '/login')
  await router.isReady()

  return mount(AuthView, { props: { initialSignup }, global: { plugins: [pinia, router] } })
}

// Botón de cambio de modo del panel visible (el oculto tiene la clase inert).
function activeSwitchButton(wrapper: VueWrapper) {
  return wrapper.findAll('button.text-link').find((button) => !button.element.closest('.inert'))
}

describe('AuthView (verso de login y registro)', () => {
  it('muestra login activo y deja registro inerte', async () => {
    const wrapper = await renderAuth(false)

    expect(wrapper.get('h1').text()).toBe('Bienvenido de nuevo.')
    expect(wrapper.findAll('.inert')).toHaveLength(1)
    expect(wrapper.get('.inert').text()).toContain('Crea tu espacio.')
  })

  it('arranca en registro cuando la ruta lo pide', async () => {
    const wrapper = await renderAuth(true)

    expect(wrapper.get('h1').text()).toBe('Crea tu espacio.')
    expect(wrapper.get('.inert').text()).toContain('Bienvenido de nuevo.')
  })

  it('al cambiar de modo lanza la hoja hacia la derecha y activa el otro panel', async () => {
    const wrapper = await renderAuth(false)

    await activeSwitchButton(wrapper)?.trigger('click')

    expect(wrapper.get('h1').text()).toBe('Crea tu espacio.')
    expect(wrapper.get('.inert').text()).toContain('Bienvenido de nuevo.')
    expect(wrapper.find('.animate-blade-right').exists()).toBe(true)
  })

  it('volver al modo anterior lanza la hoja hacia la izquierda', async () => {
    const wrapper = await renderAuth(true)

    await activeSwitchButton(wrapper)?.trigger('click')

    expect(wrapper.find('.animate-blade-left').exists()).toBe(true)
    expect(wrapper.get('h1').text()).toBe('Bienvenido de nuevo.')
  })
})
