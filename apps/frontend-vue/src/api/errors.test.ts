import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { getAiErrorMessage, getApiErrorMessage } from './errors'

function axiosError(status: number | null, data: unknown = {}) {
  const response = status === null
    ? undefined
    : ({ status, data, statusText: '', headers: {}, config: {} } as unknown as AxiosResponse)

  return new AxiosError('fallo', 'ERR', undefined, undefined, response)
}

describe('getApiErrorMessage', () => {
  it('usa el mensaje del servidor cuando lo envía', () => {
    expect(getApiErrorMessage(axiosError(400, { message: 'Email inválido' }))).toBe('Email inválido')
  })

  it('usa el texto por defecto cuando el servidor no envía mensaje', () => {
    expect(getApiErrorMessage(axiosError(500, {}), 'Algo falló.')).toBe('Algo falló.')
  })

  it('explica que no hay conexión cuando no llegó respuesta', () => {
    expect(getApiErrorMessage(axiosError(null))).toBe('No se pudo conectar con el servidor.')
  })

  it('usa el texto por defecto para errores que no son de Axios', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe('No se pudo completar la solicitud.')
  })
})

describe('getAiErrorMessage', () => {
  it('explica el límite de uso cuando el servidor responde 429', () => {
    expect(getAiErrorMessage(axiosError(429))).toBe(
      'Se alcanzó el límite de uso de la IA. Espera un momento e inténtalo de nuevo.',
    )
  })

  it('usa el mensaje del servidor cuando lo envía', () => {
    expect(getAiErrorMessage(axiosError(400, { message: 'Mensaje inválido' }))).toBe('Mensaje inválido')
  })

  it('usa el mensaje genérico de la IA cuando no hay respuesta útil', () => {
    expect(getAiErrorMessage(new Error('caído'))).toBe('La IA no pudo completar la solicitud. Inténtalo más tarde.')
  })
})
