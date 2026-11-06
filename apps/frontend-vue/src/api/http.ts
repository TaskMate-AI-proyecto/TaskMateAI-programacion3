import axios from 'axios'
import { storage } from '../lib/storage'

// Mismo backend que el frontend React: Node en el puerto 3001 (configurable con VITE_API_BASE_URL).
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

// Inyectar token JWT en cada request si existe
http.interceptors.request.use((config) => {
  const token = storage.getItem('taskmate.token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
