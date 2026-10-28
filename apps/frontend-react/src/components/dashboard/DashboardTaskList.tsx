import { Check } from 'lucide-react'
import type { Task, TaskPriority } from '../../types/api'
import { filterTasks, formatDueDate, isOverdue, priorityLabels, priorityStyles } from '../tasks/taskUtils'
import { Badge } from '../ui/Badge'

export type PriorityFilter = TaskPriority | 'ALL'

const priorityChips: { value: PriorityFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
]

const chipClass = 'rounded-full border px-3 py-1 text-xs font-semibold transition'

function emptyMessage(tasks: Task[], priority: PriorityFilter) {
  if (tasks.length === 0) return 'Aún no tienes tareas.'
  if (priority === 'ALL') return 'No hay tareas que mostrar.'

  return `No hay tareas de prioridad ${priorityLabels[priority].toLowerCase()}.`
}

interface RowProps {
  task: Task
  isPending: boolean
  onToggle: (task: Task) => void
}

function completionLabel(title: string, done: boolean) {
  return done ? `Marcar ${title} como pendiente` : `Marcar ${title} como completada`
}

function CompletionButton({ task, isPending, onToggle }: RowProps) {
  const done = task.status === 'COMPLETED'
  const tone = done ? 'border-mint bg-mint text-white' : 'border-ink/30 hover:border-ink'

  return (
    <button
      aria-label={completionLabel(task.title, done)}
      aria-pressed={done}
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition disabled:opacity-50 ${tone}`}
      disabled={isPending}
      onClick={() => onToggle(task)}
      type="button"
    >
      {done && <Check size={14} />}
    </button>
  )
}

function DueDate({ task }: { task: Task }) {
  if (!task.dueDate) return null

  const tone = isOverdue(task) ? 'font-semibold text-coral' : 'text-ink/60'

  return <span className={`text-xs ${tone}`}>{formatDueDate(task.dueDate)}</span>
}

function TaskRow(props: RowProps) {
  const { task } = props
  const done = task.status === 'COMPLETED'

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-md border border-ink/10 bg-white px-4 py-3">
      <CompletionButton {...props} />
      <span className={`min-w-0 flex-1 truncate font-medium ${done ? 'text-ink/45 line-through' : ''}`}>{task.title}</span>
      <DueDate task={task} />
      <Badge tone={priorityStyles[task.priority]}>{priorityLabels[task.priority]}</Badge>
    </li>
  )
}

function TaskRows({ tasks, priority, isLoading, pendingId, onToggle }: {
  tasks: Task[]
  priority: PriorityFilter
  isLoading: boolean
  pendingId: string | null
  onToggle: (task: Task) => void
}) {
  if (isLoading) {
    return <div aria-busy="true" className="space-y-2">{[0, 1, 2].map((item) => <div className="h-14 animate-pulse rounded-md bg-ink/10" key={item} />)}</div>
  }

  const visible = filterTasks(tasks, { search: '', status: 'ALL', priority, categoryId: '' })

  if (visible.length === 0) return <p className="empty-state rounded-md">{emptyMessage(tasks, priority)}</p>

  return (
    <ul aria-label="Lista de tareas" className="space-y-2">
      {visible.map((task) => <TaskRow isPending={pendingId === task.id} key={task.id} onToggle={onToggle} task={task} />)}
    </ul>
  )
}

interface DashboardTaskListProps {
  tasks: Task[]
  isLoading: boolean
  priority: PriorityFilter
  pendingId: string | null
  onPriorityChange: (priority: PriorityFilter) => void
  onToggle: (task: Task) => void
}

export function DashboardTaskList({ tasks, isLoading, priority, pendingId, onPriorityChange, onToggle }: DashboardTaskListProps) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">Tareas</h2>
        <div aria-label="Filtrar por prioridad" className="flex flex-wrap gap-2" role="group">
          {priorityChips.map((chip) => {
            const selected = priority === chip.value

            return (
              <button
                aria-pressed={selected}
                className={`${chipClass} ${selected ? 'border-ink bg-ink text-white' : 'border-ink/20 bg-white text-ink/70 hover:border-ink/50'}`}
                key={chip.value}
                onClick={() => onPriorityChange(chip.value)}
                type="button"
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      </div>
      <TaskRows isLoading={isLoading} onToggle={onToggle} pendingId={pendingId} priority={priority} tasks={tasks} />
    </section>
  )
}
