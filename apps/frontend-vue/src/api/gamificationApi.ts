import { http } from './http'
import type { GamificationProfile } from '../types/api'

export async function getGamificationProfile() {
  const { data } = await http.get<GamificationProfile>('/api/gamification/profile')
  return data
}
