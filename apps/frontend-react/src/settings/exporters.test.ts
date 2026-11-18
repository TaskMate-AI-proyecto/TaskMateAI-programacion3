import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { escapeCsv, exportTasks, tasksToCsv, tasksToJson } from './exporters'
import type { Task } from '../types/api'

const task: Task = {
  id: 't1',
  title: 'Entregar, "informe"',
  description: 'Línea 1\nLínea 2',
  status: 'PENDING',
  priority: 'HIGH',
  dueDate: '2026-11-20T00:00:00.000Z',
  categoryId: 'c1',
  category: { id: 'c1', name: 'Estudio', color: '#EF6F5E' },
}

describe('exporters', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:taskmate')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('escapa comas, comillas y saltos de línea en CSV', () => {
    expect(escapeCsv('sin cambios')).toBe('sin cambios')
    expect(escapeCsv('a,b')).toBe('"a,b"')
    expect(escapeCsv('di "hola"')).toBe('"di ""hola"""')
    expect(escapeCsv(null)).toBe('')
  })

  it('genera un CSV con cabecera y una fila por tarea', () => {
    const csv = tasksToCsv([task])

    expect(csv.startsWith('﻿id,titulo,descripcion,estado,prioridad,vencimiento,categoria\n')).toBe(true)
    expect(csv).toContain('t1,"Entregar, ""informe""","Línea 1\nLínea 2",PENDING,HIGH,2026-11-20T00:00:00.000Z,Estudio')
  })

  it('genera JSON legible con todas las tareas', () => {
    expect(JSON.parse(tasksToJson([task]))).toEqual([task])
  })

  it('descarga el archivo con su tipo y libera la URL temporal', () => {
    exportTasks('json', [task])

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:taskmate')
  })
})
