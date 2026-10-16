import { isAxiosError, type AxiosError } from 'axios'

type ApiError = { message?: string }

function readServerMessage(error: AxiosError<ApiError>) {
  return error.response?.data?.message
}

export function getApiErrorMessage(error: unknown, fallback = 'No se pudo completar la solicitud.') {
  if (!isAxiosError<ApiError>(error)) return fallback
  if (!error.response) return 'No se pudo conectar con el servidor.'

  return readServerMessage(error) ?? fallback
}

export function getAiErrorMessage(error: unknown) {
  if (isAxiosError<ApiError>(error) && error.response?.status === 429) {
    return 'Se alcanzó el límite de uso de la IA. Espera un momento e inténtalo de nuevo.'
  }

  return getApiErrorMessage(error, 'La IA no pudo completar la solicitud. Inténtalo más tarde.')
}
