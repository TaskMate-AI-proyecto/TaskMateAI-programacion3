import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../api/errors'
import { getGroupMessages, sendGroupMessage } from '../api/messagesApi'
import { pollIntervalMs } from '../messages/messageUtils'
import type { DirectMessage } from '../types/api'
import { usePolling } from './usePolling'

// Canal grupal de un espacio: historial y envío, con sondeo mientras la ventana está visible.
export function useGroupChannel(workspaceId: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setMessages(await getGroupMessages(workspaceId))
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar el canal.'))
    }
  }, [workspaceId])

  useEffect(() => {
    // La primera carga sale en un temporizador: no se actualiza estado dentro del propio efecto.
    const first = window.setTimeout(() => void load(), 0)

    return () => window.clearTimeout(first)
  }, [load])

  usePolling(load, pollIntervalMs)

  async function send(content: string) {
    try {
      const sent = await sendGroupMessage(workspaceId, content)
      setMessages((list) => [...list, sent])
      return true
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar el mensaje.'))
      return false
    }
  }

  return { messages, error, send }
}
