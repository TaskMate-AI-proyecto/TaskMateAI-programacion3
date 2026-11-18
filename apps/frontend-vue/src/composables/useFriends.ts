import { onMounted, ref } from 'vue'
import { getApiErrorMessage } from '../api/errors'
import { getFriendRequests, getFriends, getMe, respondToFriendRequest, sendFriendRequest } from '../api/friendsApi'
import { useToastStore } from '../stores/toast'
import type { Friend, FriendRequest, UserSummary } from '../types/api'

// Perfil propio, amigos y solicitudes activas. Las acciones recargan la lista al terminar.
export function useFriends() {
  const toast = useToastStore()
  const me = ref<UserSummary | null>(null)
  const friends = ref<Friend[]>([])
  const requests = ref<FriendRequest[]>([])
  const error = ref<string | null>(null)

  async function reload() {
    try {
      const [profile, friendList, pending] = await Promise.all([getMe(), getFriends(), getFriendRequests()])
      me.value = profile
      friends.value = friendList
      requests.value = pending
      error.value = null
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar tus amigos.')
    }
  }

  onMounted(() => {
    void reload()
  })

  async function send(uniqueTag: string) {
    try {
      await sendFriendRequest(uniqueTag)
      toast.notify('Solicitud enviada')
      await reload()
      return true
    } catch (err) {
      toast.notify(getApiErrorMessage(err, 'No se pudo enviar la solicitud.'), 'error')
      return false
    }
  }

  async function respond(requestId: string, action: 'accept' | 'reject') {
    try {
      await respondToFriendRequest(requestId, action)
      toast.notify(action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada')
      await reload()
    } catch (err) {
      toast.notify(getApiErrorMessage(err, 'No se pudo responder la solicitud.'), 'error')
    }
  }

  return { me, friends, requests, error, reload, send, respond }
}
