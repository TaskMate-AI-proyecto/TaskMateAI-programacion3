import { describe, expect, it } from 'vitest'
import type { Task } from '../../types/api'
import { buildMetrics, pickUpcoming } from './dashboardStats'
import { barRatio, buildPriorityBars, completionPercent } from './productivity'

function task(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    title: overrides.id,
    description: null,
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: null,
    categoryId: null,
    category: null,
    ...overrides,
  }
}

describe('pickUpcoming', () => {
  it('omite las completadas y ordena por fecha límite y luego por prioridad', () => {
    const tasks = [
      task({ id: 'sin-fecha-alta', priority: 'HIGH' }),
      task({ id: 'tarde', dueDate: '2026-12-10' }),
      task({ id: 'pronto-baja', dueDate: '2026-11-01', priority: 'LOW' }),
      task({ id: 'pronto-alta', dueDate: '2026-11-01', priority: 'HIGH' }),
      task({ id: 'hecha', dueDate: '2026-10-01', status: 'COMPLETED' }),
    ]

    expect(pickUpcoming(tasks).map((item) => item.id)).toEqual(['pronto-alta', 'pronto-baja', 'tarde', 'sin-fecha-alta'])
  })

  it('respeta el límite de elementos', () => {
    const tasks = [task({ id: 'a' }), task({ id: 'b' }), task({ id: 'c' })]

    expect(pickUpcoming(tasks, 2)).toHaveLength(2)
  })
})

describe('buildMetrics', () => {
  it('cuenta por estado y las vencidas que no están completadas', () => {
    const tasks = [
      task({ id: 'p', status: 'PENDING' }),
      task({ id: 'i', status: 'IN_PROGRESS' }),
      task({ id: 'c', status: 'COMPLETED', dueDate: '2000-01-01' }),
      task({ id: 'v', status: 'PENDING', dueDate: '2000-01-01' }),
    ]

    const values = Object.fromEntries(buildMetrics(tasks).map((metric) => [metric.label, metric.value]))

    expect(values).toEqual({ Total: 4, Pendientes: 2, 'En progreso': 1, Completadas: 1, Vencidas: 1 })
  })
})

describe('productividad', () => {
  const tasks = [
    task({ id: 'h1', priority: 'HIGH', status: 'COMPLETED' }),
    task({ id: 'h2', priority: 'HIGH' }),
    task({ id: 'm1', priority: 'MEDIUM', status: 'COMPLETED' }),
  ]

  it('agrupa por prioridad en el orden alta, media, baja', () => {
    const bars = buildPriorityBars(tasks)

    expect(bars.map((bar) => bar.label)).toEqual(['Alta', 'Media', 'Baja'])
    expect(bars.map((bar) => [bar.completed, bar.total])).toEqual([[1, 2], [1, 1], [0, 0]])
  })

  it('calcula el porcentaje global completado redondeado', () => {
    expect(completionPercent(buildPriorityBars(tasks))).toBe(67)
    expect(completionPercent(buildPriorityBars([]))).toBe(0)
  })

  it('escala cada barra frente a la prioridad con más tareas', () => {
    const bars = buildPriorityBars(tasks)

    expect(barRatio(bars[0], bars)).toBe(1)
    expect(barRatio(bars[1], bars)).toBe(0.5)
    expect(barRatio(bars[2], bars)).toBe(0)
  })
})
