import axios from 'axios'

// Mismo backend que el frontend React: Node en el puerto 3001 (configurable con VITE_API_BASE_URL).
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})
