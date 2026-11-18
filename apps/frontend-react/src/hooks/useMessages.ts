import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../api/errors'
import { getContacts, getConversation, markConversationRead, sendMessage } from '../api/messagesApi'
import { hasUnread, pollIntervalMs } from '../messages/messageUtils'
import type { DirectMessage, MessageContact } from '../types/api'
import { useAuth } from './useAuth'

// Mensajería directa: contactos, conversación activa y sondeo cada 3 s mientras la ventana está visible.
export function useMessages() {
  const { user } = useAuth()
  const meId = user?.id ?? ''
  const [contacts, setContacts] = useState<MessageContact[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  // Referencia para que el sondeo siempre lea la conversación abierta actual.
  const selectedRef = useRef<string | null>(null)

  const loadConversation = useCallback(async (userId: string) => {
    const list = await getConversation(userId)
    if (selectedRef.current !== userId) return

    setMessages(list)
    if (hasUnread(list, meId)) await markConversationRead(userId)
  }, [meId])

  // Primero la conversación (y su marca de leído), después los contadores de la lista.
  const sync = useCallback(async () => {
    try {
      const current = selectedRef.current
      if (current) await loadConversation(current)
      setContacts(await getContacts())
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar los mensajes.'))
    }
  }, [loadConversation])

  useEffect(() => {
    // La primera carga sale en un temporizador: no se actualiza estado dentro del propio efecto.
    const first = window.setTimeout(() => void sync(), 0)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void sync()
    }, pollIntervalMs)

    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [sync])

  function selectContact(userId: string) {
    selectedRef.current = userId
    setSelectedId(userId)
    setMessages([])
    void sync()
  }

  async function send(content: string) {
    const current = selectedRef.current
    if (!current) return false

    try {
      const sent = await sendMessage(current, content)
      if (selectedRef.current === current) setMessages((list) => [...list, sent])
      setContacts(await getContacts())
      return true
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar el mensaje.'))
      return false
    }
  }

  // Botón Actualizar: vuelve a pedir la lista y la conversación abierta, sin recargar la app.
  const refresh = useCallback(async () => {
    setRefreshing(true)
    await sync()
    setRefreshing(false)
  }, [sync])

  return { contacts, selectedId, messages, error, meId, refreshing, refresh, selectContact, send }
}
