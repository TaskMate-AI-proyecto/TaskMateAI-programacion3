import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendOtp, verifyOtp } from '../api/auth'
import { createAppRouter } from '../router'
import { useAuthStore, tokenKey } from '../stores/auth'
import OtpAuthForm from './OtpAuthForm.vue'

vi.mock('../api/auth', () => ({ sendOtp: vi.fn(), verifyOtp: vi.fn() }))

const session = { success: true as const, token: 'jwt-token', user: { id: 'u1', email: 'ana@example.com' } }

async function renderForm(mode: 'login' | 'register') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push(mode === 'login' ? '/login' : '/register')
  await router.isReady()

  const wrapper = mount(OtpAuthForm, { props: { mode }, global: { plugins: [pinia, router] } })

  return { wrapper, router }
}

function heading(wrapper: VueWrapper) {
  return wrapper.get('h1').text()
}

async function submitEmail(wrapper: VueWrapper, email: string) {
  await wrapper.get('input[type="email"]').setValue(email)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('OtpAuthForm (login en dos pasos)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(sendOtp).mockReset()
    vi.mocked(verifyOtp).mockReset()
  })

  it('arranca en el paso de correo con los textos de inicio de sesión', async () => {
    const { wrapper } = await renderForm('login')

    expect(heading(wrapper)).toBe('Bienvenido de nuevo.')
    expect(wrapper.find('input[autocomplete="one-time-code"]').exists()).toBe(false)
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(false)
  })

  it('pide el código y pasa al paso de verificación con el aviso de envío', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    const { wrapper } = await renderForm('login')

    await submitEmail(wrapper, 'ana@example.com')

    expect(sendOtp).toHaveBeenCalledWith('ana@example.com')
    expect(heading(wrapper)).toBe('Revisa tu correo.')
    expect(wrapper.text()).toContain('Enviamos un código de seis dígitos a ana@example.com.')
  })

  it('mantiene deshabilitado el botón de verificar hasta tener seis dígitos', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    const { wrapper } = await renderForm('login')
    await submitEmail(wrapper, 'ana@example.com')
    const verify = () => wrapper.get('button[type="submit"]')

    expect(verify().attributes('disabled')).toBeDefined()

    await wrapper.get('input[autocomplete="one-time-code"]').setValue('12345')
    expect(verify().attributes('disabled')).toBeDefined()

    await wrapper.get('input[autocomplete="one-time-code"]').setValue('123456')
    expect(verify().attributes('disabled')).toBeUndefined()
  })

  it('verifica el código, guarda la sesión y entra al panel', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    vi.mocked(verifyOtp).mockResolvedValue(session)
    const { wrapper, router } = await renderForm('login')
    await submitEmail(wrapper, 'ana@example.com')
    await wrapper.get('input[autocomplete="one-time-code"]').setValue('123456')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(verifyOtp).toHaveBeenCalledWith('ana@example.com', '123456')
    expect(useAuthStore().isAuthenticated).toBe(true)
    expect(localStorage.getItem(tokenKey)).toBe('jwt-token')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })

  it('muestra el error del servidor cuando no puede enviar el código', async () => {
    vi.mocked(sendOtp).mockRejectedValue(new Error('caído'))
    const { wrapper } = await renderForm('login')

    await submitEmail(wrapper, 'ana@example.com')

    expect(wrapper.get('[aria-live="polite"]').text()).toBe('No se pudo completar la solicitud.')
    expect(heading(wrapper)).toBe('Bienvenido de nuevo.')
  })

  it('muestra el error cuando el código es rechazado y no inicia sesión', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    vi.mocked(verifyOtp).mockRejectedValue(new Error('invalid'))
    const { wrapper } = await renderForm('login')
    await submitEmail(wrapper, 'ana@example.com')
    await wrapper.get('input[autocomplete="one-time-code"]').setValue('000000')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
    expect(useAuthStore().isAuthenticated).toBe(false)
  })

  it('vuelve al correo con el botón "Cambiar correo"', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    const { wrapper } = await renderForm('login')
    await submitEmail(wrapper, 'ana@example.com')

    const back = wrapper.findAll('button').find((button) => button.text() === 'Cambiar correo')
    await back?.trigger('click')

    expect(heading(wrapper)).toBe('Bienvenido de nuevo.')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('en registro pide el nombre antes del correo', async () => {
    const { wrapper } = await renderForm('register')

    expect(heading(wrapper)).toBe('Crea tu espacio.')
    expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(true)
  })
})
