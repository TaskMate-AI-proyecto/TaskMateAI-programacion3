import type { InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import axiosClient from './axiosClient'

// El interceptor de peticiones es el primer handler registrado en el cliente.
function runRequestInterceptor(headers: Record<string, string> = {}) {
  const handler = axiosClient.interceptors.request.handlers?.[0]
  const config = { headers } as unknown as InternalAxiosRequestConfig

  return handler?.fulfilled?.(config) as InternalAxiosRequestConfig
}

describe('axiosClient', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('adjunta el JWT guardado como Bearer en cada petición', () => {
    localStorage.setItem('taskmate.token', 'jwt-token')

    const config = runRequestInterceptor()

    expect(config.headers.Authorization).toBe('Bearer jwt-token')
  })

  it('no agrega cabecera de autorización cuando no hay sesión', () => {
    const config = runRequestInterceptor()

    expect(config.headers.Authorization).toBeUndefined()
  })

  it('envía JSON por defecto', () => {
    expect(axiosClient.defaults.headers['Content-Type']).toBe('application/json')
  })
})
