import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTasksData } from './useTasksData'
import * as tasksApi from '../api/tasksApi'
import * as categoriesApi from '../api/categoriesApi'
import type { Task, Category } from '../types/api'

vi.mock('../api/tasksApi')
vi.mock('../api/categoriesApi')

describe('useTasksData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { tasks, categories, isLoading, error } = useTasksData()

    expect(tasks.value).toEqual([])
    expect(categories.value).toEqual([])
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should load all tasks and categories', async () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Test',
        description: null,
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: null,
        categoryId: null,
        category: null,
      },
    ]
    const mockCategories: Category[] = [{ id: '1', name: 'Work', color: '#EF4444' }]

    vi.mocked(tasksApi.getTasks).mockResolvedValue(mockTasks)
    vi.mocked(categoriesApi.getCategories).mockResolvedValue(mockCategories)

    const { tasks, categories, loadAll, isLoading } = useTasksData()

    expect(isLoading.value).toBe(false)

    const loadPromise = loadAll()
    expect(isLoading.value).toBe(true)

    await loadPromise

    expect(tasks.value).toEqual(mockTasks)
    expect(categories.value).toEqual(mockCategories)
    expect(isLoading.value).toBe(false)
  })

  it('should handle error during load', async () => {
    const testError = new Error('API Error')
    vi.mocked(tasksApi.getTasks).mockRejectedValue(testError)
    vi.mocked(categoriesApi.getCategories).mockResolvedValue([])

    const { error, loadAll } = useTasksData()

    await loadAll()

    expect(error.value).toBeTruthy()
    expect(error.value).toContain('No se pudieron cargar')
  })

  it('should update tasks', () => {
    const { tasks, updateTasks } = useTasksData()
    const mockTask: Task = {
      id: '1',
      title: 'Updated',
      description: null,
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: null,
      categoryId: null,
      category: null,
    }

    updateTasks(() => [mockTask])

    expect(tasks.value).toEqual([mockTask])
  })

  it('should replace task in list', () => {
    const original: Task[] = [
      { id: '1', title: 'Task 1', description: null, status: 'PENDING', priority: 'HIGH', dueDate: null, categoryId: null, category: null },
      { id: '2', title: 'Task 2', description: null, status: 'PENDING', priority: 'LOW', dueDate: null, categoryId: null, category: null },
    ]

    const { tasks, updateTasks } = useTasksData()
    updateTasks(() => original)

    const updated: Task = { ...original[0], status: 'COMPLETED' }
    updateTasks((list) => list.map((t) => (t.id === updated.id ? updated : t)))

    expect(tasks.value[0].status).toBe('COMPLETED')
    expect(tasks.value[1].status).toBe('PENDING')
  })
})
