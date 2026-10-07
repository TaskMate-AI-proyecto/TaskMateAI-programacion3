import { useState, type ReactNode } from 'react'
import type { AuthUser } from '../types/api'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('taskmate.token'))
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('taskmate.user')
    return savedUser ? (JSON.parse(savedUser) as AuthUser) : null
  })

  function signIn(nextToken: string, nextUser: AuthUser) {
    localStorage.setItem('taskmate.token', nextToken)
    localStorage.setItem('taskmate.user', JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }

  function signOut() {
    localStorage.removeItem('taskmate.token')
    localStorage.removeItem('taskmate.user')
    setToken(null)
    setUser(null)
  }

  return <AuthContext value={{ token, user, signIn, signOut }}>{children}</AuthContext>
}