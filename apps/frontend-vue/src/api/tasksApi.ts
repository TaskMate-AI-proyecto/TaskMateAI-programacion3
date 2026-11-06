import { http } from './http'
import type { Task, TaskInput, TaskQuery } from '../types/api'

export async function getTasks(query: TaskQuery = {}) {
  const { data } = await http.get<Task[]>('/api/tasks', { params: query })
  return data
}

export async function getTaskById(id: string) {
  const { data } = await http.get<Task>(`/api/tasks/${id}`)
  return data
}

export async function createTask(input: TaskInput) {
  const { data } = await http.post<Task>('/api/tasks', input)
  return data
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const { data } = await http.put<Task>(`/api/tasks/${id}`, input)
  return data
}

export async function deleteTask(id: string) {
  await http.delete(`/api/tasks/${id}`)
}

export function toggleTaskStatus(task: Pick<Task, 'id' | 'status'>) {
  return updateTask(task.id, { status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })
}
