import type { AuthResponse } from '../types/auth'
import { http } from './http'

export async function sendOtp(email: string) {
  await http.post('/api/auth/send-code', { email })
}

export async function verifyOtp(email: string, code: string) {
  const { data } = await http.post<AuthResponse>('/api/auth/verify-code', { email, code })
  return data
}
