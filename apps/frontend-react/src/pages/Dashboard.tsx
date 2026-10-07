import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, ListTodo, Loader, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../api/errors'
import { getTasks } from '../api/tasksApi'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles } from '../components/tasks/taskUtils'
import type { Task } from '../types/api'

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    void getTasks()
      .then((response) => {
        if (cancelled) return
        setTasks(response)
        setError(null)
      })
      .catch((requestError) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, 'No se pudieron cargar las tareas.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [reloadKey])

  function retry() {
    setIsLoading(true)
    setReloadKey((key) => key + 1)
  }

  const pending = tasks.filter((task) => task.status !== 'COMPLETED')
  const upcoming = [...pending]
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5)
  const metrics = [
    { label: 'Total', value: tasks.length, icon: ListTodo },
    { label: 'Pendientes', value: tasks.filter((task) => task.status === 'PENDING').length, icon: CircleDashed },
    { label: 'En progreso', value: tasks.filter((task) => task.status === 'IN_PROGRESS').length, icon: Loader },
    { label: 'Completadas', value: tasks.filter((task) => task.status === 'COMPLETED').length, icon: CheckCircle2 },
    { label: 'Vencidas', value: tasks.filter(isOverdue).length, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Espacio de trabajo</p><h1 className="font-display text-4xl font-semibold">Hoy, con calma.</h1><p className="mt-2 max-w-lg text-ink/65">Un vistazo a lo que tienes en marcha.</p></div>
        <button aria-label="Actualizar" className="icon-button" disabled={isLoading} onClick={retry} title="Actualizar" type="button"><RefreshCw className={isLoading ? 'animate-spin' : ''} size={18} /></button>
      </div>
      {error ? (
        <div className="empty-state rounded-md" role="alert"><p className="text-coral">{error}</p><button className="command-button" onClick={retry} type="button"><RefreshCw size={16} />Reintentar</button></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {metrics.map(({ label, value, icon: Icon }) => (
              <article className="rounded-md border border-ink/10 bg-white p-4" key={label}>
                <Icon className="text-ink/45" size={18} />
                {isLoading ? <div className="mt-3 h-8 w-10 animate-pulse rounded bg-ink/10" /> : <p className="mt-3 font-display text-3xl font-semibold">{value}</p>}
                <p className="text-xs text-ink/60">{label}</p>
              </article>
            ))}
          </div>
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">Próximas pendientes</h2><Link className="text-link text-sm" to="/tasks">Ver todas</Link></div>
            {isLoading ? (
              <div aria-busy="true" className="space-y-2">{[0, 1, 2].map((item) => <div className="h-14 animate-pulse rounded-md bg-ink/10" key={item} />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="empty-state rounded-md"><CheckCircle2 size={28} /><p>{tasks.length === 0 ? 'Aún no tienes tareas.' : 'No tienes tareas pendientes. ¡Buen trabajo!'}</p><Link className="text-link text-sm" to="/tasks">Ir a tareas</Link></div>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((task) => (
                  <li className="flex flex-wrap items-center gap-3 rounded-md border border-ink/10 bg-white px-4 py-3" key={task.id}>
                    <span className="min-w-0 flex-1 truncate font-medium">{task.title}</span>
                    {task.dueDate && <span className={`text-xs ${isOverdue(task) ? 'font-semibold text-coral' : 'text-ink/60'}`}>{formatDueDate(task.dueDate)}</span>}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}>{priorityLabels[task.priority]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
