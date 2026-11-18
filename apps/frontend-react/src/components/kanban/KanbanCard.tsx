import type { ChangeEvent, DragEvent } from 'react'
import { CalendarDays, UserRound } from 'lucide-react'
import { avatarInitials } from '../../settings/settings'
import type { AssignedUser, Task, TaskStatus } from '../../types/api'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles } from '../tasks/taskUtils'
import { Badge } from '../ui/Badge'
import { isKanbanStatus, kanbanColumns } from './kanbanUtils'

// Hover con elevación; al arrastrar la tarjeta se encoge y brilla con sombra neón.
const cardClass = 'glass-card flex cursor-grab flex-col gap-3 p-3 transition duration-200 hover:-translate-y-1 hover:shadow-lg active:cursor-grabbing'
const draggingClass = 'opacity-70 scale-95 shadow-[0_0_24px_-4px_rgba(139,92,246,0.7)]'
const selectClass = 'w-full rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-200 disabled:opacity-50'

export interface KanbanCardHandlers {
  onDragStart: (event: DragEvent<HTMLLIElement>, task: Task) => void
  onDragEnd: () => void
  onMove: (task: Task, status: TaskStatus) => void
}

interface KanbanCardProps {
  task: Task
  isDragging: boolean
  isPending: boolean
  hasLanded: boolean
  handlers: KanbanCardHandlers
}

function DueDate({ task }: { task: Task }) {
  if (!task.dueDate) return null

  const tone = isOverdue(task) ? 'font-semibold text-coral' : 'text-slate-400'

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${tone}`}>
      <CalendarDays aria-hidden size={12} />
      {formatDueDate(task.dueDate)}
    </span>
  )
}

// Iniciales de los colaboradores; si la tarea es solo tuya, un icono neutro.
function Avatars({ users }: { users?: AssignedUser[] }) {
  if (!users || users.length === 0) {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-white/10 text-slate-300" title="Tarea personal">
        <UserRound aria-label="Tarea personal" size={14} />
      </span>
    )
  }

  return (
    <span className="flex -space-x-2">
      {users.map((user) => (
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-full border border-white/40 bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white"
          key={user.id}
          title={user.email}
        >
          {avatarInitials('', user.email)}
        </span>
      ))}
    </span>
  )
}

export function KanbanCard({ task, isDragging, isPending, hasLanded, handlers }: KanbanCardProps) {
  const done = task.status === 'COMPLETED'
  const classes = [cardClass, isDragging ? draggingClass : '', hasLanded ? 'kanban-drop' : ''].join(' ')

  // Alternativa a arrastrar para pantallas táctiles y teclado: elegir la columna desde la tarjeta.
  function handleColumnChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value
    if (isKanbanStatus(next)) handlers.onMove(task, next)
  }

  return (
    <li
      aria-busy={isPending}
      className={classes}
      draggable={!isPending}
      onDragEnd={handlers.onDragEnd}
      onDragStart={(event) => handlers.onDragStart(event, task)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`min-w-0 break-words font-semibold ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{task.title}</h3>
        <Badge tone={priorityStyles[task.priority]}>{priorityLabels[task.priority]}</Badge>
      </div>
      <div className="flex items-center justify-between gap-2">
        <DueDate task={task} />
        <Avatars users={task.assignedUsers} />
      </div>
      <select
        aria-label={`Mover ${task.title} a columna`}
        className={selectClass}
        disabled={isPending}
        onChange={handleColumnChange}
        value={task.status}
      >
        {kanbanColumns.map((column) => (
          <option key={column.status} value={column.status}>{column.label}</option>
        ))}
      </select>
    </li>
  )
}
