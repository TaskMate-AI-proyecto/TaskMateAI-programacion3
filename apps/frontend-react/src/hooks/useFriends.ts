import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../api/errors'
import { getFriendRequests, getFriends, getMe, respondToFriendRequest, sendFriendRequest } from '../api/friendsApi'
import type { Friend, FriendRequest, UserSummary } from '../types/api'
import { useToast } from './useToast'

// Perfil propio, amigos y solicitudes activas. Las acciones recargan la lista al terminar.
export function useFriends() {
  const { notify } = useToast()
  const [me, setMe] = useState<UserSummary | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [profile, friendList, pending] = await Promise.all([getMe(), getFriends(), getFriendRequests()])
      setMe(profile)
      setFriends(friendList)
      setRequests(pending)
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar tus amigos.'))
    }
  }, [])

  useEffect(() => {
    // La primera carga sale en un temporizador: no se actualiza estado dentro del propio efecto.
    const first = window.setTimeout(() => void reload(), 0)

    return () => window.clearTimeout(first)
  }, [reload])

  async function send(uniqueTag: string) {
    try {
      await sendFriendRequest(uniqueTag)
      notify('Solicitud enviada')
      await reload()
      return true
    } catch (err) {
      notify(getApiErrorMessage(err, 'No se pudo enviar la solicitud.'), 'error')
      return false
    }
  }

  async function respond(requestId: string, action: 'accept' | 'reject') {
    try {
      await respondToFriendRequest(requestId, action)
      notify(action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada')
      await reload()
    } catch (err) {
      notify(getApiErrorMessage(err, 'No se pudo responder la solicitud.'), 'error')
    }
  }

  return { me, friends, requests, error, reload, send, respond }
}
