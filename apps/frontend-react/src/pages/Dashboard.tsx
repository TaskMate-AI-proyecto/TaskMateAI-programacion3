import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getCategories } from '../api/categoriesApi'
import { getApiErrorMessage } from '../api/errors'
import { getTasks, toggleTaskStatus, updateTask } from '../api/tasksApi'
import { DailySummaryWidget } from '../components/ai/DailySummaryWidget'
import { CategoryTiles } from '../components/dashboard/CategoryTiles'
import { DashboardTaskList, type PriorityFilter } from '../components/dashboard/DashboardTaskList'
import { MetricCards } from '../components/dashboard/MetricCards'
import { ProductivityChart } from '../components/dashboard/ProductivityChart'
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks'
import { ProductivityReportExport } from '../components/reports/ProductivityReportExport'
import { ErrorPanel } from '../components/ui/ErrorPanel'
import { useAsyncData } from '../hooks/useAsyncData'
import { useSafeAction } from '../hooks/useSafeAction'
import { useRefreshOnTaskChanges } from '../hooks/useTaskSync'
import { usePolling } from '../hooks/usePolling'
import { useRewardNotifier } from '../hooks/useRewardNotifier'
import { useActiveWorkspaceId } from '../hooks/useWorkspace'
import { workspaceQuery } from '../utils/workspaceQuery'
import { useViewMode } from '../hooks/useViewMode'
import type { Task, TaskStatus } from '../types/api'

const describeError = (error: unknown) => getApiErrorMessage(error, 'No se pudieron cargar las tareas.')
const describeCategoriesError = (error: unknown) => getApiErrorMessage(error, 'No se pudieron cargar las categorías.')

function replaceTask(list: Task[], updated: Task) {
  return list.map((item) => (item.id === updated.id ? updated : item))
}

export function Dashboard() {
  const runSafely = useSafeAction()
  const announceReward = useRewardNotifier()
  // Con un espacio activo el panel solo cuenta sus tareas; la clave incluye el espacio para volver a pedirlas al cambiarlo.
  const workspaceId = useActiveWorkspaceId()
  const { data, error, isLoading, setData, refresh, reload } = useAsyncData(() => getTasks(workspaceQuery(workspaceId)), `tasks:${workspaceId}`, { describeError })
  const categories = useAsyncData(() => getCategories(), 'dashboard-categories', { describeError: describeCategoriesError })
  const [priority, setPriority] = useState<PriorityFilter>('ALL')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useViewMode()
  const tasks = data ?? []
  // Si el asistente crea, edita o borra tareas, el listado se vuelve a pedir sin recargar la página.
  useRefreshOnTaskChanges(refresh)
  // Las tareas compartidas por un amigo llegan sin recargar: se vuelven a pedir cada 5 s con la ventana visible.
  usePolling(refresh, 5000)

  async function handleToggle(task: Task) {
    setPendingId(task.id)
    const result = await runSafely(() => toggleTaskStatus(task))
    setPendingId(null)
    if (!result.ok) return

    announceReward(result.value)
    setData((current) => current && replaceTask(current, result.value))
  }

  // Al soltar una tarjeta en otra columna se actualiza al instante (KPIs incluidos) y luego se guarda en la API.
  // Si la API falla, la tarjeta vuelve a su columna original.
  async function handleMove(task: Task, status: TaskStatus) {
    setPendingId(task.id)
    setData((current) => current && replaceTask(current, { ...task, status }))
    const result = await runSafely(() => updateTask(task.id, { status }))
    setPendingId(null)
    if (result.ok) announceReward(result.value)
    setData((current) => current && replaceTask(current, result.ok ? result.value : task))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Espacio de trabajo</p>
          <h1 className="font-display text-4xl font-semibold text-slate-100">Hoy, con calma.</h1>
          <p className="mt-2 max-w-lg text-slate-400">Un vistazo a lo que tienes en marcha.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ProductivityReportExport />
        <button aria-label="Actualizar" className="icon-button" disabled={isLoading} onClick={reload} title="Actualizar" type="button"><RefreshCw className={isLoading ? 'animate-spin' : ''} size={18} /></button>
        </div>
      </div>
      <DailySummaryWidget />
      {error ? <ErrorPanel message={error} onRetry={reload} /> : (
        <>
          <MetricCards isLoading={isLoading} tasks={tasks} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <DashboardTaskList
              isLoading={isLoading}
              onMove={(task, status) => void handleMove(task, status)}
              onPriorityChange={setPriority}
              onToggle={(task) => void handleToggle(task)}
              onViewChange={setViewMode}
              pendingId={pendingId}
              priority={priority}
              tasks={tasks}
              view={viewMode}
            />
            <div className="space-y-6">
              <ProductivityChart isLoading={isLoading} tasks={tasks} />
              <CategoryTiles categories={categories.data ?? []} error={categories.error} tasks={tasks} />
            </div>
          </div>
          <UpcomingTasks isLoading={isLoading} tasks={tasks} />
        </>
      )}
    </div>
  )
}
