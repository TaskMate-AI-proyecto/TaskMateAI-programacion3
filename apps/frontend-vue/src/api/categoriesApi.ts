import { http } from './http'
import type { Category, CategoryInput } from '../types/api'

export async function getCategories() {
  const { data } = await http.get<Category[]>('/api/categories')
  return data
}

export async function getCategoryById(id: string) {
  const { data } = await http.get<Category>(`/api/categories/${id}`)
  return data
}

export async function createCategory(input: CategoryInput) {
  const { data } = await http.post<Category>('/api/categories', input)
  return data
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const { data } = await http.put<Category>(`/api/categories/${id}`, input)
  return data
}

export async function deleteCategory(id: string) {
  await http.delete(`/api/categories/${id}`)
}
