import { useEffect, useState } from 'react'
import { Activity, RefreshCw, Server } from 'lucide-react'
import { getHealth } from '../api/health'
import type { HealthResponse } from '../types/api'

export function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadHealth() {
    setIsLoading(true)
    setError(null)
    try {
      setHealth(await getHealth())
    } catch {
      setHealth(null)
      setError('No se pudo conectar con el backend local.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    void getHealth()
      .then((response) => {
        if (!cancelled) setHealth(response)
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo conectar con el backend local.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Espacio de trabajo</p><h1 className="font-display text-4xl font-semibold">Hoy, con calma.</h1><p className="mt-2 max-w-lg text-ink/65">Tu tablero estará listo para tareas, categorías y sugerencias de IA.</p></div>
        <button className="icon-button" disabled={isLoading} onClick={() => void loadHealth()} title="Actualizar estado" type="button"><RefreshCw className={isLoading ? 'animate-spin' : ''} size={18} /></button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="status-panel"><div className="flex items-center justify-between"><Server size={22} /><span className={health?.status === 'ok' ? 'status-ok' : 'status-wait'}>{isLoading ? 'Comprobando' : health?.status === 'ok' ? 'Conectado' : 'Sin conexión'}</span></div><h2>Backend</h2><p>{error ?? (health ? `Respuesta recibida a las ${new Date(health.timestamp).toLocaleTimeString()}.` : 'Esperando respuesta.')}</p></article>
        <article className="status-panel"><div className="flex items-center justify-between"><Activity size={22} /><span className={health?.database === 'connected' ? 'status-ok' : 'status-wait'}>{health?.database === 'connected' ? 'Disponible' : 'Pendiente'}</span></div><h2>Base de datos</h2><p>{health?.database === 'connected' ? 'PostgreSQL responde correctamente.' : 'Se actualizará al conectar el backend.'}</p></article>
      </div>
    </div>
  )
}