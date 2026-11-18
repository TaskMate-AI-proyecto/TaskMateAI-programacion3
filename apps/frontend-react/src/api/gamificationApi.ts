import axiosClient from './axiosClient'
import type { GamificationProfile } from '../types/api'

export async function getGamificationProfile() {
  const { data } = await axiosClient.get<GamificationProfile>('/api/gamification/profile')
  return data
}
