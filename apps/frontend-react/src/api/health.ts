import axiosClient from './axiosClient'
import type { HealthResponse } from '../types/api'

export async function getHealth() {
  const { data } = await axiosClient.get<HealthResponse>('/health')
  return data
}