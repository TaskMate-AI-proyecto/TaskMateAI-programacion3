import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Task } from '../../types/api'
import { Badge } from '../ui/Badge'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles } from '../tasks/taskUtils'
import { pickUpcoming } from './dashboardStats'

function UpcomingItem({ task }: { task: Task }) {
  const dueTone = isOverdue(task) ? 'font-semibold text-coral' : 'text-slate-400'

  return (
    <li className="glass-card flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1 truncate font-medium">{task.title}</span>
      {task.dueDate && <span className={`text-xs ${dueTone}`}>{formatDueDate(task.dueDate)}</span>}
      <Badge tone={priorityStyles[task.priority]}>{priorityLabels[task.priority]}</Badge>
    </li>
  )
}

function UpcomingBody({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  const upcoming = pickUpcoming(tasks)

  if (isLoading) {
    return <div aria-busy="true" className="space-y-2">{[0, 1, 2].map((item) => <div className="h-14 animate-pulse rounded-md bg-slate-800/70" key={item} />)}</div>
  }

  if (upcoming.length === 0) {
    return (
      <div className="empty-state rounded-md">
        <CheckCircle2 size={28} />
        <p>{tasks.length === 0 ? 'Aún no tienes tareas.' : 'No tienes tareas pendientes. ¡Buen trabajo!'}</p>
        <Link className="text-link text-sm" to="/tasks">Ir a tareas</Link>
      </div>
    )
  }

  return <ul className="space-y-2">{upcoming.map((task) => <UpcomingItem key={task.id} task={task} />)}</ul>
}

export function UpcomingTasks({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl font-semibold text-slate-100">Próximas pendientes</h2><Link className="text-link text-sm" to="/tasks">Ver todas</Link></div>
      <UpcomingBody isLoading={isLoading} tasks={tasks} />
    </section>
  )
}
