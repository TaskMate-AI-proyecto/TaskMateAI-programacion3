import axiosClient from './axiosClient'
import type { Task, TaskInput, TaskQuery } from '../types/api'

export async function getTasks(query: TaskQuery = {}) {
  const { data } = await axiosClient.get<Task[]>('/api/tasks', { params: query })
  return data
}

export async function getTaskById(id: string) {
  const { data } = await axiosClient.get<Task>(`/api/tasks/${id}`)
  return data
}

export async function createTask(input: TaskInput) {
  const { data } = await axiosClient.post<Task>('/api/tasks', input)
  return data
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const { data } = await axiosClient.put<Task>(`/api/tasks/${id}`, input)
  return data
}

export async function deleteTask(id: string) {
  await axiosClient.delete(`/api/tasks/${id}`)
}

// El backend no tiene endpoint dedicado: alterna el estado con PUT.
export function toggleTaskStatus(task: Pick<Task, 'id' | 'status'>) {
  return updateTask(task.id, { status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })
}
