import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { storage } from '../lib/storage'
import { isAuthUser, type AuthResponse, type AuthUser } from '../types/auth'

// Mismas claves que la app React: el JWT y el usuario viven en localStorage.
export const tokenKey = 'taskmate.token'
export const userKey = 'taskmate.user'

function readStoredUser(): AuthUser | null {
  const raw = storage.getItem(userKey)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)

    return isAuthUser(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(storage.getItem(tokenKey))
  const user = ref<AuthUser | null>(readStoredUser())
  const isAuthenticated = computed(() => token.value !== null)

  function setSession(session: AuthResponse) {
    token.value = session.token
    user.value = session.user
    storage.setItem(tokenKey, session.token)
    storage.setItem(userKey, JSON.stringify(session.user))
  }

  function clearSession() {
    token.value = null
    user.value = null
    storage.removeItem(tokenKey)
    storage.removeItem(userKey)
  }

  return { token, user, isAuthenticated, setSession, clearSession }
})
