import type { Task, TaskStatus } from '../../types/api'

export interface KanbanColumnConfig {
  status: TaskStatus
  label: string
}

// Cada columna corresponde a un estado real de la base de datos: soltar una tarjeta cambia su estado.
export const kanbanColumns: KanbanColumnConfig[] = [
  { status: 'PENDING', label: 'Por Hacer' },
  { status: 'IN_PROGRESS', label: 'En Progreso' },
  { status: 'IN_REVIEW', label: 'En Revisión' },
  { status: 'COMPLETED', label: 'Completadas' },
]

export function isKanbanStatus(value: string): value is TaskStatus {
  return kanbanColumns.some((column) => column.status === value)
}

export function tasksInColumn(tasks: Task[], status: TaskStatus) {
  return tasks.filter((task) => task.status === status)
}
