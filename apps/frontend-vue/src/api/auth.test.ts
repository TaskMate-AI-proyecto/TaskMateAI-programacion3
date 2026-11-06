import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendOtp, verifyOtp } from './auth'

const http = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('./http', () => ({ http }))

describe('api/auth', () => {
  beforeEach(() => {
    http.post.mockReset()
  })

  it('pide el código al endpoint de envío', async () => {
    http.post.mockResolvedValue({ data: { success: true } })

    await sendOtp('ana@example.com')

    expect(http.post).toHaveBeenCalledWith('/api/auth/send-code', { email: 'ana@example.com' })
  })

  it('verifica el código y devuelve la sesión', async () => {
    const session = { success: true, token: 'jwt', user: { id: 'u1', email: 'ana@example.com' } }
    http.post.mockResolvedValue({ data: session })

    await expect(verifyOtp('ana@example.com', '123456')).resolves.toEqual(session)
    expect(http.post).toHaveBeenCalledWith('/api/auth/verify-code', { email: 'ana@example.com', code: '123456' })
  })
})
