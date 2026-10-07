import axiosClient from './axiosClient'
import type { Category, CategoryInput } from '../types/api'

export async function getCategories() {
  const { data } = await axiosClient.get<Category[]>('/api/categories')
  return data
}

export async function createCategory(input: CategoryInput) {
  const { data } = await axiosClient.post<Category>('/api/categories', input)
  return data
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const { data } = await axiosClient.put<Category>(`/api/categories/${id}`, input)
  return data
}

export async function deleteCategory(id: string) {
  await axiosClient.delete(`/api/categories/${id}`)
}
