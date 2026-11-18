import type { Task } from '../types/api'

export type ExportFormat = 'json' | 'csv'

const csvHeader = ['id', 'titulo', 'descripcion', 'estado', 'prioridad', 'vencimiento', 'categoria']

export function tasksToJson(tasks: Task[]) {
  return JSON.stringify(tasks, null, 2)
}

// Campos con comas, comillas o saltos de línea van entre comillas, duplicando las comillas internas.
export function escapeCsv(value: string | null) {
  const text = value ?? ''

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// BOM al principio para que Excel lea bien los acentos.
export function tasksToCsv(tasks: Task[]) {
  const rows = tasks.map((task) =>
    [task.id, task.title, task.description, task.status, task.priority, task.dueDate, task.category?.name ?? null]
      .map(escapeCsv)
      .join(','),
  )

  return `﻿${[csvHeader.join(','), ...rows].join('\n')}`
}

export function downloadFile(name: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function exportTasks(format: ExportFormat, tasks: Task[]) {
  const name = `taskmate-tareas.${format}`

  if (format === 'json') downloadFile(name, tasksToJson(tasks), 'application/json')
  else downloadFile(name, tasksToCsv(tasks), 'text/csv;charset=utf-8')
}
