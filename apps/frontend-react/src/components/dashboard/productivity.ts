import type { Task, TaskPriority } from '../../types/api'
import { priorityLabels } from '../tasks/taskUtils'

export interface PriorityBar {
  priority: TaskPriority
  label: string
  completed: number
  total: number
}

const priorityOrder: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW']

// Una barra por prioridad con cuántas tareas están completadas del total.
export function buildPriorityBars(tasks: Task[]): PriorityBar[] {
  return priorityOrder.map((priority) => {
    const group = tasks.filter((task) => task.priority === priority)

    return {
      priority,
      label: priorityLabels[priority],
      completed: group.filter((task) => task.status === 'COMPLETED').length,
      total: group.length,
    }
  })
}

export function completionPercent(bars: PriorityBar[]) {
  const total = bars.reduce((sum, bar) => sum + bar.total, 0)
  const completed = bars.reduce((sum, bar) => sum + bar.completed, 0)

  return total === 0 ? 0 : Math.round((completed / total) * 100)
}

// Altura relativa de una barra frente a la prioridad con más tareas (mínimo 1 para evitar divisiones por cero).
export function barRatio(bar: PriorityBar, bars: PriorityBar[]) {
  const max = Math.max(1, ...bars.map((item) => item.total))

  return bar.total / max
}
