import { isAxiosError, type AxiosError } from 'axios'

interface ServerBody {
  message?: string
}

const noConnectionMessage = 'No se pudo conectar con el servidor.'
const aiFallbackMessage = 'La IA no pudo completar la solicitud. Inténtalo más tarde.'
const aiRateLimitMessage = 'Se alcanzó el límite de uso de la IA. Espera un momento e inténtalo de nuevo.'

function readServerMessage(error: AxiosError<ServerBody>, fallback: string) {
  return error.response?.data?.message ?? fallback
}

// Mismos mensajes que el frontend React, para que el usuario vea lo mismo en ambas apps.
export function getApiErrorMessage(error: unknown, fallback = 'No se pudo completar la solicitud.') {
  if (!isAxiosError<ServerBody>(error)) return fallback
  if (!error.response) return noConnectionMessage

  return readServerMessage(error, fallback)
}

export function getAiErrorMessage(error: unknown) {
  if (isAxiosError<ServerBody>(error) && error.response?.status === 429) return aiRateLimitMessage

  return getApiErrorMessage(error, aiFallbackMessage)
}
