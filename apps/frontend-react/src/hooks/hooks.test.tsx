import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsyncData } from './useAsyncData'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

describe('useAsyncData', () => {
  it('expone el error y avisa con el mensaje descrito cuando la carga falla', async () => {
    const onError = vi.fn()
    const load = vi.fn().mockRejectedValue(new Error('caído'))

    const { result } = renderHook(() =>
      useAsyncData(load, 'tasks', { describeError: () => 'No se pudieron cargar las tareas.', onError }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('No se pudieron cargar las tareas.')
    expect(result.current.data).toBeNull()
    expect(onError).toHaveBeenCalledWith('No se pudieron cargar las tareas.')
  })

  it('vuelve a cargar al pedir reload, mostrando el estado de carga', async () => {
    const load = vi.fn().mockResolvedValueOnce('primera').mockResolvedValueOnce('segunda')

    const { result } = renderHook(() => useAsyncData(load, 'k', { describeError: String }))
    await waitFor(() => expect(result.current.data).toBe('primera'))

    act(() => result.current.reload())

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toBe('segunda'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('vuelve a cargar al pedir refresh sin mostrar carga', async () => {
    const load = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2)

    const { result } = renderHook(() => useAsyncData(load, 'k', { describeError: String }))
    await waitFor(() => expect(result.current.data).toBe(1))

    act(() => result.current.refresh())

    await waitFor(() => expect(result.current.data).toBe(2))
    expect(result.current.isLoading).toBe(false)
  })
})

describe('hooks de contexto', () => {
  it('useAuth exige estar dentro de AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe usarse dentro de AuthProvider')
  })

  it('useToast exige estar dentro de ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow('useToast debe usarse dentro de ToastProvider')
  })
})
