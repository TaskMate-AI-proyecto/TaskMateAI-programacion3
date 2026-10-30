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

  it('empieza en el paso de correo, sin mensajes ni error', () => {
    const flow = useOtpFlow({ onSession: vi.fn() })

    expect(flow.step.value).toBe('email')
    expect(flow.message.value).toBeNull()
    expect(flow.error.value).toBeNull()
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

  it('sólo permite verificar con seis dígitos y sanitiza lo que se escribe', () => {
    const flow = useOtpFlow({ onSession: vi.fn() })

    flow.setCode('12a3-4b5 6789')

    expect(flow.code.value).toBe('123456')
    expect(flow.canVerify.value).toBe(true)

    flow.setCode('123')
    expect(flow.canVerify.value).toBe(false)
  })

  it('verifica el código y entrega la sesión al terminar', async () => {
    vi.mocked(verifyOtp).mockResolvedValue(session)
    const onSession = vi.fn()
    const flow = useOtpFlow({ onSession })
    flow.email.value = 'ana@example.com'
    flow.setCode('123456')

    await flow.verifyCode()

    expect(verifyOtp).toHaveBeenCalledWith('ana@example.com', '123456')
    expect(onSession).toHaveBeenCalledWith(session)
    expect(flow.error.value).toBeNull()
  })

  it('no inicia sesión cuando el código es rechazado', async () => {
    vi.mocked(verifyOtp).mockRejectedValue(new Error('invalid'))
    const onSession = vi.fn()
    const flow = useOtpFlow({ onSession })
    flow.setCode('000000')

    await flow.verifyCode()
    await flushPromises()

    expect(onSession).not.toHaveBeenCalled()
    expect(flow.error.value).toBe('No se pudo completar la solicitud.')
  })

  it('vuelve al correo limpiando el código y el error', async () => {
    vi.mocked(sendOtp).mockResolvedValue(undefined)
    const flow = useOtpFlow({ onSession: vi.fn() })
    await flow.requestCode()
    flow.setCode('123')
    flow.error.value = 'algo'

    flow.backToEmail()

    expect(flow.step.value).toBe('email')
    expect(flow.code.value).toBe('')
    expect(flow.error.value).toBeNull()
  })
})
