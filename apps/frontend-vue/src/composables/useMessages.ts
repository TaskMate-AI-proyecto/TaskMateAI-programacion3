import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getApiErrorMessage } from '../api/errors'
import { getContacts, getConversation, markConversationRead, sendMessage } from '../api/messagesApi'
import { hasUnread, pollIntervalMs } from '../messages/messageUtils'
import { useAuthStore } from '../stores/auth'
import type { DirectMessage, MessageContact } from '../types/api'

// Mensajería directa: misma lógica que useMessages de React (contactos, conversación activa, sondeo cada 3 s).
export function useMessages() {
  const auth = useAuthStore()
  const meId = computed(() => auth.user?.id ?? '')
  const contacts = ref<MessageContact[]>([])
  const selectedId = ref<string | null>(null)
  const messages = ref<DirectMessage[]>([])
  const error = ref<string | null>(null)
  const refreshing = ref(false)
  // Copia no reactiva de la conversación abierta, para que el sondeo siempre lea la actual.
  let selected: string | null = null
  let timer: number | undefined

  async function loadConversation(userId: string) {
    const list = await getConversation(userId)
    if (selected !== userId) return

    messages.value = list
    if (hasUnread(list, meId.value)) await markConversationRead(userId)
  }

  // Primero la conversación (y su marca de leído), después los contadores de la lista.
  async function sync() {
    try {
      if (selected) await loadConversation(selected)
      contacts.value = await getContacts()
      error.value = null
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar los mensajes.')
    }
  }

  onMounted(() => {
    void sync()
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void sync()
    }, pollIntervalMs)
  })

  onBeforeUnmount(() => window.clearInterval(timer))

  function selectContact(userId: string) {
    selected = userId
    selectedId.value = userId
    messages.value = []
    void sync()
  }

  async function send(content: string) {
    const current = selected
    if (!current) return false

    try {
      const sent = await sendMessage(current, content)
      if (selected === current) messages.value = [...messages.value, sent]
      contacts.value = await getContacts()
      return true
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudo enviar el mensaje.')
      return false
    }
  }

  // Botón Actualizar: vuelve a pedir la lista y la conversación abierta, sin recargar la app.
  async function refresh() {
    refreshing.value = true
    await sync()
    refreshing.value = false
  }

  return { contacts, selectedId, messages, error, meId, refreshing, refresh, selectContact, send }
}
