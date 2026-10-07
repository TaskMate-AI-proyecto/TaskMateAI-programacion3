import { ClipboardList, Plus, SearchX } from 'lucide-react'
import type { Task } from '../../types/api'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
  hasFilters: boolean
  pendingId: string | null
  onCreate: () => void
  onClearFilters: () => void
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskList({ tasks, isLoading, hasFilters, pendingId, onCreate, onClearFilters, onToggle, onEdit, onDelete }: TaskListProps) {
  if (isLoading) {
    return (
      <ul aria-busy="true" aria-label="Cargando tareas" className="space-y-3">
        {[0, 1, 2].map((item) => (
          <li className="flex animate-pulse gap-3 rounded-md border border-ink/10 bg-white p-4" key={item}>
            <div className="h-6 w-6 rounded-full bg-ink/10" />
            <div className="flex-1 space-y-2.5"><div className="h-4 w-1/3 rounded bg-ink/10" /><div className="h-3 w-3/4 rounded bg-ink/10" /><div className="h-3 w-1/4 rounded bg-ink/10" /></div>
          </li>
        ))}
      </ul>
    )
  }

  if (tasks.length === 0) {
    return hasFilters ? (
      <div className="empty-state rounded-md">
        <SearchX size={28} />
        <p>Ninguna tarea coincide con los filtros.</p>
        <button className="text-link text-sm" onClick={onClearFilters} type="button">Limpiar filtros</button>
      </div>
    ) : (
      <div className="empty-state rounded-md">
        <ClipboardList size={28} />
        <p>Aún no tienes tareas. Crea la primera para empezar.</p>
        <button className="command-button" onClick={onCreate} type="button"><Plus size={16} />Nueva tarea</button>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <TaskCard isBusy={pendingId === task.id} key={task.id} onDelete={onDelete} onEdit={onEdit} onToggle={onToggle} task={task} />
      ))}
    </ul>
  )
}
