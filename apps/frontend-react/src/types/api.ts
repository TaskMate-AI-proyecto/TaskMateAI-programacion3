export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  database: 'connected' | 'unavailable'
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  success: true
  token: string
  user: AuthUser
}