import { useState } from 'react'
import type { Task, TaskStatus } from '../../types/api'
import { KanbanColumn, type KanbanColumnHandlers } from './KanbanColumn'
import { kanbanColumns, tasksInColumn } from './kanbanUtils'

const dragDataType = 'text/plain'

interface KanbanBoardProps {
  tasks: Task[]
  isLoading: boolean
  pendingId: string | null
  onMove: (task: Task, status: TaskStatus) => void
}

function KanbanSkeleton() {
  return (
    <div aria-busy="true" className="flex gap-4 overflow-x-auto pb-3">
      {kanbanColumns.map((column) => (
        <div className="min-w-[280px] flex-1 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4" key={column.status}>
          <div className="h-6 w-24 animate-pulse rounded-md bg-slate-800/70" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-800/70" />
        </div>
      ))}
    </div>
  )
}

// Tablero de 4 columnas. Soltar una tarjeta en otra columna cambia su estado (la columna nueva lo define).
export function KanbanBoard({ tasks, isLoading, pendingId, onMove }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null)
  const [landedId, setLandedId] = useState<string | null>(null)

  if (isLoading) return <KanbanSkeleton />

  function clearDrag() {
    setDraggingId(null)
    setOverStatus(null)
  }

  const handlers: KanbanColumnHandlers = {
    onDragStart(event, task) {
      event.dataTransfer.setData(dragDataType, task.id)
      event.dataTransfer.effectAllowed = 'move'
      setDraggingId(task.id)
      setLandedId(null)
    },
    onDragEnd: clearDrag,
    onDragOver(event, status) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setOverStatus(status)
    },
    onDragLeave(event, status) {
      // Pasar sobre los hijos de la columna también dispara "dragleave": sólo se limpia al salir de ella.
      if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
      setOverStatus((current) => (current === status ? null : current))
    },
    onDrop(event, status) {
      event.preventDefault()
      const task = tasks.find((item) => item.id === event.dataTransfer.getData(dragDataType))
      clearDrag()
      if (!task || task.status === status) return

      setLandedId(task.id)
      onMove(task, status)
    },
    onMove,
  }

  return (
    <div aria-label="Tablero Kanban" className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3" role="region">
      {kanbanColumns.map((column) => (
        <KanbanColumn
          column={column}
          dragState={{ draggingId, landedId, pendingId }}
          handlers={handlers}
          isOver={overStatus === column.status}
          key={column.status}
          tasks={tasksInColumn(tasks, column.status)}
        />
      ))}
    </div>
  )
}
