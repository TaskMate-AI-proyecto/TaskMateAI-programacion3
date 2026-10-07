import { createContext } from 'react'
import type { AuthUser } from '../types/api'

export interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)