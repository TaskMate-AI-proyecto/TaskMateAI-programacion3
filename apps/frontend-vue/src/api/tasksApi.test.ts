import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http } from './http'
import { getTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from './tasksApi'
import type { Task, TaskInput } from '../types/api'

vi.mock('./http')

describe('tasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTasks', () => {
    it('should fetch tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test Description',
          status: 'PENDING',
          priority: 'HIGH',
          dueDate: '2026-12-01',
          categoryId: null,
          category: null,
        },
      ]

      vi.mocked(http.get).mockResolvedValue({ data: mockTasks })

      const result = await getTasks()

      expect(result).toEqual(mockTasks)
      expect(http.get).toHaveBeenCalledWith('/api/tasks', { params: {} })
    })

    it('should pass query parameters', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: [] })

      await getTasks({ categoryId: 'cat-1' })

      expect(http.get).toHaveBeenCalledWith('/api/tasks', { params: { categoryId: 'cat-1' } })
    })
  })

  describe('createTask', () => {
    it('should create a task', async () => {
      const input: TaskInput = { title: 'New Task', priority: 'MEDIUM' }
      const mockTask: Task = {
        id: '2',
        title: 'New Task',
        description: null,
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: null,
        categoryId: null,
        category: null,
      }

      vi.mocked(http.post).mockResolvedValue({ data: mockTask })

      const result = await createTask(input)

      expect(result).toEqual(mockTask)
      expect(http.post).toHaveBeenCalledWith('/api/tasks', input)
    })
  })

  describe('updateTask', () => {
    it('should update a task', async () => {
      const input: Partial<TaskInput> = { status: 'COMPLETED' }
      const mockTask: Task = {
        id: '1',
        title: 'Updated Task',
        description: null,
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: null,
        categoryId: null,
        category: null,
      }

      vi.mocked(http.put).mockResolvedValue({ data: mockTask })

      const result = await updateTask('1', input)

      expect(result).toEqual(mockTask)
      expect(http.put).toHaveBeenCalledWith('/api/tasks/1', input)
    })
  })

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      vi.mocked(http.delete).mockResolvedValue({ data: null })

      await deleteTask('1')

      expect(http.delete).toHaveBeenCalledWith('/api/tasks/1')
    })
  })

  describe('toggleTaskStatus', () => {
    it('should toggle status from PENDING to COMPLETED', async () => {
      const mockTask: Task = {
        id: '1',
        title: 'Task',
        description: null,
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: null,
        categoryId: null,
        category: null,
      }

      vi.mocked(http.put).mockResolvedValue({ data: mockTask })

      const result = await toggleTaskStatus({ id: '1', status: 'PENDING' })

      expect(result).toEqual(mockTask)
      expect(http.put).toHaveBeenCalledWith('/api/tasks/1', { status: 'COMPLETED' })
    })

    it('should toggle status from COMPLETED to PENDING', async () => {
      const mockTask: Task = {
        id: '1',
        title: 'Task',
        description: null,
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: null,
        categoryId: null,
        category: null,
      }

      vi.mocked(http.put).mockResolvedValue({ data: mockTask })

      const result = await toggleTaskStatus({ id: '1', status: 'COMPLETED' })

      expect(result).toEqual(mockTask)
      expect(http.put).toHaveBeenCalledWith('/api/tasks/1', { status: 'PENDING' })
    })
  })
})
