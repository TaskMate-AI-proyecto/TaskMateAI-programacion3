import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http } from './http'
import { getCategories, createCategory, updateCategory, deleteCategory } from './categoriesApi'
import type { Category, CategoryInput } from '../types/api'

vi.mock('./http')

describe('categoriesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategories', () => {
    it('should fetch categories', async () => {
      const mockCategories: Category[] = [
        { id: '1', name: 'Work', color: '#EF4444' },
        { id: '2', name: 'Personal', color: '#3B82F6' },
      ]

      vi.mocked(http.get).mockResolvedValue({ data: mockCategories })

      const result = await getCategories()

      expect(result).toEqual(mockCategories)
      expect(http.get).toHaveBeenCalledWith('/api/categories')
    })
  })

  describe('createCategory', () => {
    it('should create a category', async () => {
      const input: CategoryInput = { name: 'Study', color: '#10B981' }
      const mockCategory: Category = { id: '3', name: 'Study', color: '#10B981' }

      vi.mocked(http.post).mockResolvedValue({ data: mockCategory })

      const result = await createCategory(input)

      expect(result).toEqual(mockCategory)
      expect(http.post).toHaveBeenCalledWith('/api/categories', input)
    })
  })

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const input: Partial<CategoryInput> = { name: 'Updated Work' }
      const mockCategory: Category = { id: '1', name: 'Updated Work', color: '#EF4444' }

      vi.mocked(http.put).mockResolvedValue({ data: mockCategory })

      const result = await updateCategory('1', input)

      expect(result).toEqual(mockCategory)
      expect(http.put).toHaveBeenCalledWith('/api/categories/1', input)
    })
  })

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      vi.mocked(http.delete).mockResolvedValue({ data: null })

      await deleteCategory('1')

      expect(http.delete).toHaveBeenCalledWith('/api/categories/1')
    })
  })
})
