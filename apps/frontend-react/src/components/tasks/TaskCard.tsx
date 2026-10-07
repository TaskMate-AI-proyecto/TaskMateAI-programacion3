import { useState } from 'react'
import { CalendarDays, Check, Pencil, Trash2 } from 'lucide-react'
import type { Task } from '../../types/api'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles, statusLabels, statusStyles } from './taskUtils'

interface TaskCardProps {
  task: Task
  isBusy: boolean
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

const badgeClass = 'rounded-full px-2.5 py-1 text-xs font-semibold'
const actionClass = 'inline-grid h-8 w-8 place-items-center rounded-md text-ink/60 transition hover:bg-ink/5 hover:text-ink disabled:opacity-50'

export function TaskCard({ task, isBusy, onToggle, onEdit, onDelete }: TaskCardProps) {
  const [confirming, setConfirming] = useState(false)
  const done = task.status === 'COMPLETED'
  const overdue = isOverdue(task)

  return (
    <li className="flex gap-3 rounded-md border border-ink/10 bg-white p-4 shadow-[0_8px_22px_rgba(20,33,61,0.05)]">
      <button
        aria-label={done ? 'Marcar como pendiente' : 'Marcar como completada'}
        aria-pressed={done}
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition disabled:opacity-50 ${done ? 'border-mint bg-mint text-white' : 'border-ink/30 hover:border-ink'}`}
        disabled={isBusy}
        onClick={() => onToggle(task)}
        type="button"
      >
        {done && <Check size={14} />}
      </button>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`font-semibold ${done ? 'text-ink/45 line-through' : ''}`}>{task.title}</h3>
          <span className={`${badgeClass} ${statusStyles[task.status]}`}>{statusLabels[task.status]}</span>
          <span className={`${badgeClass} ${priorityStyles[task.priority]}`}>Prioridad {priorityLabels[task.priority].toLowerCase()}</span>
        </div>
        {task.description && <p className="text-sm leading-6 text-ink/65">{task.description}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink/60">
          {task.category && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-2.5 py-1">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: task.category.color }} />
              {task.category.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1.5 ${overdue ? 'font-semibold text-coral' : ''}`}>
              <CalendarDays size={14} />
              {formatDueDate(task.dueDate)}{overdue && ' · Vencida'}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {confirming ? (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-ink/60">¿Eliminar?</span>
            <button className="rounded-md bg-coral px-2 py-1 font-semibold text-white disabled:opacity-50" disabled={isBusy} onClick={() => onDelete(task)} type="button">Sí</button>
            <button className="rounded-md px-2 py-1 font-semibold text-ink/70 hover:bg-ink/5" onClick={() => setConfirming(false)} type="button">No</button>
          </div>
        ) : (
          <>
            <button aria-label={`Editar ${task.title}`} className={actionClass} disabled={isBusy} onClick={() => onEdit(task)} type="button"><Pencil size={16} /></button>
            <button aria-label={`Eliminar ${task.title}`} className={actionClass} disabled={isBusy} onClick={() => setConfirming(true)} type="button"><Trash2 size={16} /></button>
          </>
        )}
      </div>
    </li>
  )
}
