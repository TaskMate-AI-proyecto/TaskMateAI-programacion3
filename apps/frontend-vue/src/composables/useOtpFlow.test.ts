import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendOtp, verifyOtp } from '../api/auth'
import { useOtpFlow } from './useOtpFlow'

vi.mock('../api/auth', () => ({ sendOtp: vi.fn(), verifyOtp: vi.fn() }))

const session = { success: true as const, token: 'jwt', user: { id: 'u1', email: 'ana@example.com' } }

describe('useOtpFlow', () => {
  beforeEach(() => {
    vi.mocked(sendOtp).mockReset()
    vi.mocked(verifyOtp).mockReset()
  })

  it('empieza en el paso de correo, sin mensajes, error ni verificación en curso', () => {
    const flow = useOtpFlow({ onSession: vi.fn() })

    expect(flow.step.value).toBe('email')
    expect(flow.message.value).toBeNull()
    expect(flow.error.value).toBeNull()
    expect(flow.otpStatus.value).toBe('idle')
  })

  it('pide el código y pasa al paso de verificación', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    const flow = useOtpFlow({ onSession: vi.fn() })
    flow.email.value = 'ana@example.com'

    await flow.requestCode()

    expect(sendOtp).toHaveBeenCalledWith('ana@example.com')
    expect(flow.step.value).toBe('code')
    expect(flow.message.value).toBe('Enviamos un código de seis dígitos a ana@example.com.')
    expect(flow.isSubmitting.value).toBe(false)
  })

  it('muestra el error del servidor y se queda en el paso de correo', async () => {
    vi.mocked(sendOtp).mockRejectedValue(new Error('caído'))
    const flow = useOtpFlow({ onSession: vi.fn() })

    await flow.requestCode()

    expect(flow.error.value).toBe('No se pudo completar la solicitud.')
    expect(flow.step.value).toBe('email')
  })

  it('pasa por "verifying" mientras espera al servidor', async () => {
    let resolveVerify: (value: typeof session) => void = () => {}
    vi.mocked(verifyOtp).mockReturnValue(new Promise((resolve) => { resolveVerify = resolve }))
    const flow = useOtpFlow({ onSession: vi.fn() })
    flow.email.value = 'ana@example.com'

    const pending = flow.verifyCode('123456')
    expect(flow.otpStatus.value).toBe('verifying')

    resolveVerify(session)
    await pending
    expect(flow.otpStatus.value).toBe('success')
  })

  it('entrega la sesión sólo al terminar la animación de éxito', async () => {
    vi.mocked(verifyOtp).mockResolvedValue(session)
    const onSession = vi.fn()
    const flow = useOtpFlow({ onSession })
    flow.email.value = 'ana@example.com'

    await flow.verifyCode('123456')

    expect(verifyOtp).toHaveBeenCalledWith('ana@example.com', '123456')
    expect(onSession).not.toHaveBeenCalled()

    flow.completeLogin()
    expect(onSession).toHaveBeenCalledWith(session)
  })

  it('marca error cuando el código es rechazado y no inicia sesión', async () => {
    vi.mocked(verifyOtp).mockRejectedValue(new Error('invalid'))
    const onSession = vi.fn()
    const flow = useOtpFlow({ onSession })

    await flow.verifyCode('000000')
    flow.completeLogin()
    await flushPromises()

    expect(flow.otpStatus.value).toBe('error')
    expect(flow.error.value).toBe('No se pudo completar la solicitud.')
    expect(onSession).not.toHaveBeenCalled()
  })

  it('vuelve a estado normal al volver a escribir tras un error', async () => {
    vi.mocked(verifyOtp).mockRejectedValue(new Error('invalid'))
    const flow = useOtpFlow({ onSession: vi.fn() })
    await flow.verifyCode('000000')

    flow.resetOtpStatus()

    expect(flow.otpStatus.value).toBe('idle')
    expect(flow.error.value).toBeNull()
  })

  it('vuelve al correo limpiando el estado y el error', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    const flow = useOtpFlow({ onSession: vi.fn() })
    await flow.requestCode()
    flow.error.value = 'algo'
    flow.otpStatus.value = 'error'

    flow.backToEmail()

    expect(flow.step.value).toBe('email')
    expect(flow.otpStatus.value).toBe('idle')
    expect(flow.error.value).toBeNull()
  })
})
