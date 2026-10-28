import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getApiErrorMessage } from '../api/errors'
import { getTasks, toggleTaskStatus } from '../api/tasksApi'
import { DailySummaryWidget } from '../components/ai/DailySummaryWidget'
import { DashboardTaskList, type PriorityFilter } from '../components/dashboard/DashboardTaskList'
import { MetricCards } from '../components/dashboard/MetricCards'
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks'
import { ErrorPanel } from '../components/ui/ErrorPanel'
import { useAsyncData } from '../hooks/useAsyncData'
import { useSafeAction } from '../hooks/useSafeAction'
import type { Task } from '../types/api'

const describeError = (error: unknown) => getApiErrorMessage(error, 'No se pudieron cargar las tareas.')

function replaceTask(list: Task[], updated: Task) {
  return list.map((item) => (item.id === updated.id ? updated : item))
}

export function Dashboard() {
  const runSafely = useSafeAction()
  const { data, error, isLoading, setData, reload } = useAsyncData(() => getTasks(), 'tasks', { describeError })
  const [priority, setPriority] = useState<PriorityFilter>('ALL')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const tasks = data ?? []

  async function handleToggle(task: Task) {
    setPendingId(task.id)
    const result = await runSafely(() => toggleTaskStatus(task))
    setPendingId(null)
    if (result.ok) setData((current) => current && replaceTask(current, result.value))
  }

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
          <DashboardTaskList
            isLoading={isLoading}
            onPriorityChange={setPriority}
            onToggle={(task) => void handleToggle(task)}
            pendingId={pendingId}
            priority={priority}
            tasks={tasks}
          />
          <UpcomingTasks isLoading={isLoading} tasks={tasks} />
        </>
      )}
    </div>
  )
}
