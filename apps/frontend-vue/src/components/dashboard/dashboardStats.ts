import { AlertTriangle, CheckCircle2, CircleDashed, ListTodo, Loader } from 'lucide-vue-next'
import type { Task, TaskStatus } from '../../types/api'
import { isOverdue } from '../../utils/taskUtils'

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const

function compareByUrgency(a: Task, b: Task) {
  const byDueDate = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')

  return byDueDate || priorityOrder[a.priority] - priorityOrder[b.priority]
}

// Tareas pendientes ordenadas por fecha límite y, después, por prioridad.
export function pickUpcoming(tasks: Task[], limit = 5) {
  return tasks.filter((task) => task.status !== 'COMPLETED').sort(compareByUrgency).slice(0, limit)
}

export function buildMetrics(tasks: Task[]) {
  const countByStatus = (status: TaskStatus) => tasks.filter((task) => task.status === status).length

  return [
    { label: 'Total', value: tasks.length, icon: ListTodo },
    { label: 'Pendientes', value: countByStatus('PENDING'), icon: CircleDashed },
    // "En progreso" incluye las tareas en revisión: siguen abiertas y no deben desaparecer de los KPIs.
    { label: 'En progreso', value: countByStatus('IN_PROGRESS') + countByStatus('IN_REVIEW'), icon: Loader },
    { label: 'Completadas', value: countByStatus('COMPLETED'), icon: CheckCircle2 },
    { label: 'Vencidas', value: tasks.filter(isOverdue).length, icon: AlertTriangle },
  ]
}
