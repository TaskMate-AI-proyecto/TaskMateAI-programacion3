import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendOtp } from '../api/auth'
import App from '../App.vue'
import { createAppRouter } from './index'

vi.mock('../api/auth', () => ({ sendOtp: vi.fn(), verifyOtp: vi.fn() }))

// Monta la app completa (App → RouterView → vista → formulario) en la ruta indicada.
async function renderAt(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()

  return mount(App, { global: { plugins: [pinia, router] } })
}

describe('render de Auth por ruta', () => {
  beforeEach(() => {
    vi.mocked(sendOtp).mockReset()
  })

  it.each([
    ['/login', 'Bienvenido de nuevo.'],
    ['/register', 'Crea tu espacio.'],
  ])('%s muestra el paso de correo, sin casillas OTP todavía', async (path, title) => {
    const wrapper = await renderAt(path)

    expect(wrapper.get('h1').text()).toBe(title)
    expect(wrapper.find('[role="group"][aria-label="Código de verificación"]').exists()).toBe(false)
  })

  it('tras pedir el código la vista monta el componente GlassyOTP con seis casillas', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    const wrapper = await renderAt('/login')

    await wrapper.get('input[type="email"]').setValue('ana@example.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Revisa tu correo.')
    expect(wrapper.find('[role="group"][aria-label="Código de verificación"]').exists()).toBe(true)
    expect(wrapper.findAll('input[aria-label^="Dígito"]')).toHaveLength(6)
  })
})
