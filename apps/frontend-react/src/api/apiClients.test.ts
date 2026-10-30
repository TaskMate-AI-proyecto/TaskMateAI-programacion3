import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '../types/api'
import { generateSubtasks, getDailySummary } from './aiApi'
import { createCategory, deleteCategory, getCategories, updateCategory } from './categoriesApi'
import { getHealth } from './health'
import { createTask, deleteTask, getTaskById, getTasks, toggleTaskStatus, updateTask } from './tasksApi'

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('./axiosClient', () => ({ default: client }))

const task: Task = {
  id: 't1',
  title: 'Estudiar',
  description: null,
  status: 'PENDING',
  priority: 'HIGH',
  dueDate: null,
  categoryId: null,
  category: null,
}

describe('clientes de API', () => {
  beforeEach(() => {
    client.get.mockResolvedValue({ data: task })
    client.post.mockResolvedValue({ data: task })
    client.put.mockResolvedValue({ data: task })
    client.delete.mockResolvedValue({ data: undefined })
  })

  describe('tasksApi', () => {
    it('lista las tareas con los filtros como parámetros de consulta', async () => {
      client.get.mockResolvedValue({ data: [task] })

      await expect(getTasks({ categoryId: 'c1' })).resolves.toEqual([task])
      expect(client.get).toHaveBeenCalledWith('/api/tasks', { params: { categoryId: 'c1' } })
    })

    it('lista sin filtros por defecto', async () => {
      client.get.mockResolvedValue({ data: [] })

      await getTasks()

      expect(client.get).toHaveBeenCalledWith('/api/tasks', { params: {} })
    })

    it('obtiene una tarea por id', async () => {
      await expect(getTaskById('t1')).resolves.toEqual(task)
      expect(client.get).toHaveBeenCalledWith('/api/tasks/t1')
    })

    it('crea, actualiza y elimina tareas', async () => {
      await createTask({ title: 'Nueva' })
      expect(client.post).toHaveBeenCalledWith('/api/tasks', { title: 'Nueva' })

      await updateTask('t1', { title: 'Cambiada' })
      expect(client.put).toHaveBeenCalledWith('/api/tasks/t1', { title: 'Cambiada' })

      await expect(deleteTask('t1')).resolves.toBeUndefined()
      expect(client.delete).toHaveBeenCalledWith('/api/tasks/t1')
    })

    it('completa una tarea pendiente y reabre una completada', async () => {
      await toggleTaskStatus({ id: 't1', status: 'PENDING' })
      expect(client.put).toHaveBeenLastCalledWith('/api/tasks/t1', { status: 'COMPLETED' })

      await toggleTaskStatus({ id: 't1', status: 'COMPLETED' })
      expect(client.put).toHaveBeenLastCalledWith('/api/tasks/t1', { status: 'PENDING' })
    })
  })

  describe('categoriesApi', () => {
    it('gestiona las categorías del usuario', async () => {
      client.get.mockResolvedValue({ data: [{ id: 'c1' }] })

      await expect(getCategories()).resolves.toEqual([{ id: 'c1' }])
      expect(client.get).toHaveBeenCalledWith('/api/categories')

      await createCategory({ name: 'Facultad', color: '#22c55e' })
      expect(client.post).toHaveBeenCalledWith('/api/categories', { name: 'Facultad', color: '#22c55e' })

      await updateCategory('c1', { name: 'Trabajo' })
      expect(client.put).toHaveBeenCalledWith('/api/categories/c1', { name: 'Trabajo' })

      await deleteCategory('c1')
      expect(client.delete).toHaveBeenCalledWith('/api/categories/c1')
    })
  })

  describe('aiApi', () => {
    it('genera subtareas a partir de la tarea guardada', async () => {
      client.post.mockResolvedValue({ data: { success: true, subtasks: ['Leer', 'Resumir', 'Repasar'] } })

      await expect(generateSubtasks('t1')).resolves.toEqual(['Leer', 'Resumir', 'Repasar'])
      expect(client.get).toHaveBeenCalledWith('/api/tasks/t1')
      expect(client.post).toHaveBeenCalledWith('/api/ai/generate-subtasks', {
        title: 'Estudiar',
        description: undefined,
      })
    })

    it('envía la descripción cuando la tarea la tiene', async () => {
      client.get.mockResolvedValue({ data: { ...task, description: 'Parcial' } })
      client.post.mockResolvedValue({ data: { success: true, subtasks: ['Leer'] } })

      await generateSubtasks('t1')

      expect(client.post).toHaveBeenCalledWith('/api/ai/generate-subtasks', {
        title: 'Estudiar',
        description: 'Parcial',
      })
    })

    it('pide el resumen diario', async () => {
      client.post.mockResolvedValue({ data: { success: true, summary: 'Hoy: estudiar.' } })

      await expect(getDailySummary()).resolves.toBe('Hoy: estudiar.')
      expect(client.post).toHaveBeenCalledWith('/api/ai/summarize', {})
    })
  })

  it('consulta el healthcheck', async () => {
    client.get.mockResolvedValue({ data: { status: 'ok' } })

    await expect(getHealth()).resolves.toEqual({ status: 'ok' })
    expect(client.get).toHaveBeenCalledWith('/health')
  })
})
