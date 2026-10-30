import { describe, expect, it } from 'vitest'
import type { Task } from '../../types/api'
import { barRatio, buildPriorityBars, completionPercent } from './productivity'

function task(priority: Task['priority'], status: Task['status'] = 'PENDING'): Task {
  return { id: `${priority}-${status}`, title: 'Tarea', description: null, status, priority, dueDate: null, categoryId: null, category: null }
}

describe('productividad por prioridad', () => {
  it('cuenta completadas y totales por prioridad en el orden Alta, Media, Baja', () => {
    const bars = buildPriorityBars([task('LOW', 'COMPLETED'), task('HIGH'), task('HIGH', 'COMPLETED')])

    expect(bars.map((bar) => bar.label)).toEqual(['Alta', 'Media', 'Baja'])
    expect(bars[0]).toMatchObject({ completed: 1, total: 2 })
    expect(bars[1]).toMatchObject({ completed: 0, total: 0 })
    expect(bars[2]).toMatchObject({ completed: 1, total: 1 })
  })

  it('calcula el porcentaje completado del total y devuelve 0 sin tareas', () => {
    expect(completionPercent(buildPriorityBars([task('HIGH', 'COMPLETED'), task('LOW')]))).toBe(50)
    expect(completionPercent(buildPriorityBars([]))).toBe(0)
  })

  it('escala cada barra frente a la prioridad con más tareas', () => {
    const bars = buildPriorityBars([task('HIGH'), task('HIGH'), task('LOW')])

    expect(barRatio(bars[0], bars)).toBe(1)
    expect(barRatio(bars[2], bars)).toBe(0.5)
    expect(barRatio(bars[1], bars)).toBe(0)
  })

  it('no divide por cero cuando no hay tareas', () => {
    const bars = buildPriorityBars([])

    expect(barRatio(bars[0], bars)).toBe(0)
  })
})
