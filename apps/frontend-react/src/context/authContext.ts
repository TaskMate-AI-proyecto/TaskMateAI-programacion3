import { createContext } from 'react'
import type { AuthUser } from '../types/api'

export interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  signIn: (token: string, user: AuthUser) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)