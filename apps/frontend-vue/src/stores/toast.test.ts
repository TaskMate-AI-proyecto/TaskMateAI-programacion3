import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToastStore } from './toast'

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('agrega el aviso con su tipo y lo retira a los 4 segundos', () => {
    const toast = useToastStore()

    toast.notify('Listo', 'success')
    expect(toast.toasts).toEqual([expect.objectContaining({ message: 'Listo', kind: 'success' })])

    vi.advanceTimersByTime(3999)
    expect(toast.toasts).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toast.toasts).toHaveLength(0)
  })

  it('usa éxito como tipo por defecto', () => {
    const toast = useToastStore()

    toast.notify('Guardado')

    expect(toast.toasts[0].kind).toBe('success')
  })

  it('descarta un aviso concreto sin tocar los demás', () => {
    const toast = useToastStore()
    toast.notify('uno', 'error')
    toast.notify('dos')

    toast.dismiss(toast.toasts[0].id)

    expect(toast.toasts.map((item) => item.message)).toEqual(['dos'])
  })
})
