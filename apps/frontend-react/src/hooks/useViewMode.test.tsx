import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useViewMode, viewModeStorageKey } from './useViewMode'

describe('useViewMode', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('usa la lista si el usuario nunca eligió una vista', () => {
    const { result } = renderHook(() => useViewMode())

    expect(result.current[0]).toBe('list')
  })

  it('recupera la vista Kanban guardada', () => {
    window.localStorage.setItem(viewModeStorageKey, 'kanban')

    const { result } = renderHook(() => useViewMode())

    expect(result.current[0]).toBe('kanban')
  })

  it('ignora un valor guardado que no es una vista válida', () => {
    window.localStorage.setItem(viewModeStorageKey, 'tablero-raro')

    const { result } = renderHook(() => useViewMode())

    expect(result.current[0]).toBe('list')
  })

  it('guarda en localStorage la vista que elige el usuario', () => {
    const { result } = renderHook(() => useViewMode())

    act(() => result.current[1]('kanban'))

    expect(result.current[0]).toBe('kanban')
    expect(window.localStorage.getItem(viewModeStorageKey)).toBe('kanban')
  })

  it('sigue el cambio de vista hecho en otra pestaña', () => {
    const { result } = renderHook(() => useViewMode())

    act(() => {
      window.localStorage.setItem(viewModeStorageKey, 'kanban')
      window.dispatchEvent(new StorageEvent('storage', { key: viewModeStorageKey, newValue: 'kanban' }))
    })

    expect(result.current[0]).toBe('kanban')
  })
})
