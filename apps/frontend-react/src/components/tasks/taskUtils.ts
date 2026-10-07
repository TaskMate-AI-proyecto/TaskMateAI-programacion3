import type { Task, TaskPriority, TaskStatus } from '../../types/api'

export const fieldClass = 'mt-1.5 w-full rounded-md border border-ink/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink'

export const statusLabels: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
}

export const statusStyles: Record<TaskStatus, string> = {
  PENDING: 'bg-ink/10 text-ink/70',
  IN_PROGRESS: 'bg-sky-100 text-sky-800',
  COMPLETED: 'bg-mint/15 text-mint',
}

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

export const priorityStyles: Record<TaskPriority, string> = {
  LOW: 'bg-mint/15 text-mint',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-coral/15 text-coral',
}

export interface TaskFilterState {
  search: string
  status: TaskStatus | 'ALL'
  priority: TaskPriority | 'ALL'
  categoryId: string
}

export const emptyFilters: TaskFilterState = { search: '', status: 'ALL', priority: 'ALL', categoryId: '' }

export function hasActiveFilters(filters: TaskFilterState) {
  return filters.search.trim() !== '' || filters.status !== 'ALL' || filters.priority !== 'ALL' || filters.categoryId !== ''
}

export function filterTasks(tasks: Task[], filters: TaskFilterState) {
  const search = filters.search.trim().toLowerCase()

  return tasks.filter((task) => {
    if (filters.status !== 'ALL' && task.status !== filters.status) return false
    if (filters.priority !== 'ALL' && task.priority !== filters.priority) return false
    if (!search) return true
    return task.title.toLowerCase().includes(search) || (task.description ?? '').toLowerCase().includes(search)
  })
}

// La fecha se guarda a medianoche UTC, por eso se formatea en UTC.
export function formatDueDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>) {
  if (!task.dueDate || task.status === 'COMPLETED') return false
  return task.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10)
}
