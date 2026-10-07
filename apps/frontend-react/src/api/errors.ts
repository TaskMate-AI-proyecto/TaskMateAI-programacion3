import { isAxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'No se pudo completar la solicitud.') {
  if (isAxiosError<{ message?: string }>(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor.'
    return error.response.data?.message ?? fallback
  }

  return fallback
}
