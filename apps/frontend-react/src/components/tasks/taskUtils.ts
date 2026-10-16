import type { Category, Task, TaskInput, TaskPriority, TaskStatus } from '../../types/api'
import { toOptions, withEmptyOption, type SelectOption } from '../ui/selectOptions'

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

export const statusFilterLabels: Record<TaskStatus, string> = {
  PENDING: 'Pendientes',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completadas',
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

export const statusOptions = toOptions(statusLabels)
export const priorityOptions = toOptions(priorityLabels)
export const statusFilterOptions: SelectOption<TaskStatus | 'ALL'>[] = [{ value: 'ALL', label: 'Todas' }, ...toOptions(statusFilterLabels)]
export const priorityFilterOptions: SelectOption<TaskPriority | 'ALL'>[] = [{ value: 'ALL', label: 'Cualquier prioridad' }, ...priorityOptions]

export function toCategoryOptions(categories: Category[], emptyLabel: string) {
  return withEmptyOption(emptyLabel, categories.map((category) => ({ value: category.id, label: category.name })))
}

export interface TaskFormValues {
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  categoryId: string
  dueDate: string
}

const emptyForm: TaskFormValues = { title: '', description: '', priority: 'MEDIUM', status: 'PENDING', categoryId: '', dueDate: '' }

export function toFormValues(task: Task | null): TaskFormValues {
  if (!task) return emptyForm

  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    categoryId: task.categoryId ?? '',
    dueDate: (task.dueDate ?? '').slice(0, 10),
  }
}

function blankToUndefined(value: string) {
  return value.trim() || undefined
}

export function toTaskInput(values: TaskFormValues): TaskInput {
  return {
    title: values.title.trim(),
    description: blankToUndefined(values.description),
    priority: values.priority,
    status: values.status,
    categoryId: blankToUndefined(values.categoryId),
    dueDate: blankToUndefined(values.dueDate),
  }
}

export function appendSubtasks(description: string, subtasks: string[]) {
  return [description.trim(), ...subtasks.map((subtask) => `- [ ] ${subtask}`)].filter(Boolean).join('\n')
}

export const emptyFilters: TaskFilterState = { search: '', status: 'ALL', priority: 'ALL', categoryId: '' }

export function hasActiveFilters(filters: TaskFilterState) {
  return filters.search.trim() !== '' || filters.status !== 'ALL' || filters.priority !== 'ALL' || filters.categoryId !== ''
}

function matchesOption<T extends string>(selected: T | 'ALL', value: T) {
  return selected === 'ALL' || selected === value
}

function matchesSearch(task: Task, search: string) {
  return !search || task.title.toLowerCase().includes(search) || (task.description ?? '').toLowerCase().includes(search)
}

export function filterTasks(tasks: Task[], filters: TaskFilterState) {
  const search = filters.search.trim().toLowerCase()

  return tasks.filter((task) => matchesOption(filters.status, task.status) && matchesOption(filters.priority, task.priority) && matchesSearch(task, search))
}

// La fecha se guarda a medianoche UTC, por eso se formatea en UTC.
export function formatDueDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>) {
  if (!task.dueDate || task.status === 'COMPLETED') return false
  return task.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10)
}
