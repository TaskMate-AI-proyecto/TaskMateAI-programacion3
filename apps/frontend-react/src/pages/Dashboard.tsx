import { RefreshCw } from 'lucide-react'
import { getApiErrorMessage } from '../api/errors'
import { getTasks } from '../api/tasksApi'
import { DailySummaryWidget } from '../components/ai/DailySummaryWidget'
import { MetricCards } from '../components/dashboard/MetricCards'
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks'
import { ErrorPanel } from '../components/ui/ErrorPanel'
import { useAsyncData } from '../hooks/useAsyncData'

const describeError = (error: unknown) => getApiErrorMessage(error, 'No se pudieron cargar las tareas.')

export function Dashboard() {
  const { data, error, isLoading, reload } = useAsyncData(() => getTasks(), 'tasks', { describeError })
  const tasks = data ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Espacio de trabajo</p><h1 className="font-display text-4xl font-semibold">Hoy, con calma.</h1><p className="mt-2 max-w-lg text-ink/65">Un vistazo a lo que tienes en marcha.</p></div>
        <button aria-label="Actualizar" className="icon-button" disabled={isLoading} onClick={reload} title="Actualizar" type="button"><RefreshCw className={isLoading ? 'animate-spin' : ''} size={18} /></button>
      </div>
      <DailySummaryWidget />
      {error ? <ErrorPanel message={error} onRetry={reload} /> : (
        <>
          <MetricCards isLoading={isLoading} tasks={tasks} />
          <UpcomingTasks isLoading={isLoading} tasks={tasks} />
        </>
      )}
    </div>
  )
}
