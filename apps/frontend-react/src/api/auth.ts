import axiosClient from './axiosClient'
import type { AuthResponse } from '../types/api'

export async function sendOtp(email: string) {
  await axiosClient.post('/api/auth/send-code', { email })
}

export async function verifyOtp(email: string, code: string) {
  const { data } = await axiosClient.post<AuthResponse>('/api/auth/verify-code', { email, code })
  return data
}