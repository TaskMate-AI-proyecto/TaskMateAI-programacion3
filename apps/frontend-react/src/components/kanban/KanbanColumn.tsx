import type { DragEvent } from 'react'
import type { Task, TaskStatus } from '../../types/api'
import { KanbanCard, type KanbanCardHandlers } from './KanbanCard'
import type { KanbanColumnConfig } from './kanbanUtils'

// Columna glassy V5; en pantallas pequeñas el tablero entero hace scroll horizontal con ajuste por columna.
const columnClass = 'flex min-w-[280px] flex-1 snap-start flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition'
const overClass = 'ring-2 ring-indigo-400/70 bg-indigo-500/10'

export interface KanbanColumnHandlers extends KanbanCardHandlers {
  onDragOver: (event: DragEvent<HTMLElement>, status: TaskStatus) => void
  onDragLeave: (event: DragEvent<HTMLElement>, status: TaskStatus) => void
  onDrop: (event: DragEvent<HTMLElement>, status: TaskStatus) => void
}

export interface KanbanDragState {
  draggingId: string | null
  landedId: string | null
  pendingId: string | null
}

interface KanbanColumnProps {
  column: KanbanColumnConfig
  tasks: Task[]
  isOver: boolean
  dragState: KanbanDragState
  handlers: KanbanColumnHandlers
}

export function KanbanColumn({ column, tasks, isOver, dragState, handlers }: KanbanColumnProps) {
  return (
    <section
      aria-label={column.label}
      className={`${columnClass} ${isOver ? overClass : ''}`}
      onDragLeave={(event) => handlers.onDragLeave(event, column.status)}
      onDragOver={(event) => handlers.onDragOver(event, column.status)}
      onDrop={(event) => handlers.onDrop(event, column.status)}
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-slate-100">{column.label}</h2>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-300">{tasks.length}</span>
      </header>
      <ul className="flex min-h-24 flex-col gap-3">
        {tasks.map((task) => (
          <KanbanCard
            handlers={handlers}
            hasLanded={dragState.landedId === task.id}
            isDragging={dragState.draggingId === task.id}
            isPending={dragState.pendingId === task.id}
            key={task.id}
            task={task}
          />
        ))}
      </ul>
      {tasks.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-slate-400">Suelta una tarea aquí</p>
      )}
    </section>
  )
}
