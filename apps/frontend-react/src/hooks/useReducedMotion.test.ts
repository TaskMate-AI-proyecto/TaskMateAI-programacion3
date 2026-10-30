import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from './useReducedMotion'

function mockMedia(initialMatches: boolean) {
  const listeners = new Set<() => void>()
  const media = {
    matches: initialMatches,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }

  vi.spyOn(window, 'matchMedia').mockImplementation(() => media as unknown as MediaQueryList)

  return {
    change(matches: boolean) {
      media.matches = matches
      listeners.forEach((listener) => listener())
    },
  }
}

describe('useReducedMotion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports the system preference', () => {
    mockMedia(true)

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(true)
  })

  it('follows changes of the system preference while mounted', () => {
    const media = mockMedia(false)
    const { result } = renderHook(() => useReducedMotion())

    act(() => media.change(true))

    expect(result.current).toBe(true)
  })
})
