import { http } from './http'

// El reporte lo genera el servicio Python (Groq + PDF); el token del usuario viaja igual que en la API Node.
const pythonApiBaseUrl: string = import.meta.env.VITE_PYTHON_API_BASE_URL || 'http://localhost:8000'

export async function requestProductivityReport(): Promise<Blob> {
  const { data } = await http.post<Blob>(`${pythonApiBaseUrl}/api/ai/productivity-report`, undefined, { responseType: 'blob' })

  return data
}
