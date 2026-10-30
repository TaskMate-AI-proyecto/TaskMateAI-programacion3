export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  success: true
  token: string
  user: AuthUser
}

export type AuthMode = 'login' | 'register'

export function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return typeof candidate.id === 'string' && typeof candidate.email === 'string'
}
