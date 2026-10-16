import { useState } from 'react'
import { CalendarDays, Check, Pencil, Trash2 } from 'lucide-react'
import type { Category, Task } from '../../types/api'
import { Badge } from '../ui/Badge'
import { ConfirmDelete } from '../ui/ConfirmDelete'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles, statusLabels, statusStyles } from './taskUtils'

interface TaskCardProps {
  task: Task
  isBusy: boolean
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

const actionClass = 'inline-grid h-8 w-8 place-items-center rounded-md text-ink/60 transition hover:bg-ink/5 hover:text-ink disabled:opacity-50'

function CompletionToggle({ done, isBusy, onToggle }: { done: boolean; isBusy: boolean; onToggle: () => void }) {
  const tone = done ? 'border-mint bg-mint text-white' : 'border-ink/30 hover:border-ink'

  return (
    <button aria-label={done ? 'Marcar como pendiente' : 'Marcar como completada'} aria-pressed={done} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition disabled:opacity-50 ${tone}`} disabled={isBusy} onClick={onToggle} type="button">
      {done && <Check size={14} />}
    </button>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-2.5 py-1">
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  )
}

function DueDateLabel({ task }: { task: Task & { dueDate: string } }) {
  const overdue = isOverdue(task)

  return (
    <span className={`inline-flex items-center gap-1.5 ${overdue ? 'font-semibold text-coral' : ''}`}>
      <CalendarDays size={14} />
      {formatDueDate(task.dueDate)}{overdue && ' · Vencida'}
    </span>
  )
}

function TaskMeta({ task }: { task: Task }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-ink/60">
      {task.category && <CategoryBadge category={task.category} />}
      {task.dueDate && <DueDateLabel task={{ ...task, dueDate: task.dueDate }} />}
    </div>
  )
}

function CardActions({ task, isBusy, onEdit, onDelete }: Omit<TaskCardProps, 'onToggle'>) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return <ConfirmDelete isBusy={isBusy} onCancel={() => setConfirming(false)} onConfirm={() => onDelete(task)} />
  }

  return (
    <>
      <button aria-label={`Editar ${task.title}`} className={actionClass} disabled={isBusy} onClick={() => onEdit(task)} type="button"><Pencil size={16} /></button>
      <button aria-label={`Eliminar ${task.title}`} className={actionClass} disabled={isBusy} onClick={() => setConfirming(true)} type="button"><Trash2 size={16} /></button>
    </>
  )
}

export function TaskCard({ task, isBusy, onToggle, onEdit, onDelete }: TaskCardProps) {
  const done = task.status === 'COMPLETED'

  return (
    <li className="flex gap-3 rounded-md border border-ink/10 bg-white p-4 shadow-[0_8px_22px_rgba(20,33,61,0.05)]">
      <CompletionToggle done={done} isBusy={isBusy} onToggle={() => onToggle(task)} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`font-semibold ${done ? 'text-ink/45 line-through' : ''}`}>{task.title}</h3>
          <Badge tone={statusStyles[task.status]}>{statusLabels[task.status]}</Badge>
          <Badge tone={priorityStyles[task.priority]}>{`Prioridad ${priorityLabels[task.priority].toLowerCase()}`}</Badge>
        </div>
        {task.description && <p className="whitespace-pre-line text-sm leading-6 text-ink/65">{task.description}</p>}
        <TaskMeta task={task} />
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <CardActions isBusy={isBusy} onDelete={onDelete} onEdit={onEdit} task={task} />
      </div>
    </li>
  )
}
