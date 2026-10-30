import { isAxiosError, type AxiosError } from 'axios'

interface ServerBody {
  message?: string
}

const noConnectionMessage = 'No se pudo conectar con el servidor.'

function readServerMessage(error: AxiosError<ServerBody>, fallback: string) {
  return error.response?.data?.message ?? fallback
}

// Mismos mensajes que el frontend React, para que el usuario vea lo mismo en ambas apps.
export function getApiErrorMessage(error: unknown, fallback = 'No se pudo completar la solicitud.') {
  if (!isAxiosError<ServerBody>(error)) return fallback
  if (!error.response) return noConnectionMessage

  return readServerMessage(error, fallback)
}
