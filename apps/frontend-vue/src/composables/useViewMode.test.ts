import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { useViewMode, viewModeStorageKey } from './useViewMode'

// Monta un componente mínimo para que el composable se ejecute dentro de setup (necesario para onMounted).
function mountViewMode() {
  let result: ReturnType<typeof useViewMode> | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useViewMode()
        return () => h('div')
      },
    }),
  )

  if (!result) throw new Error('El composable no se ejecutó')

  return { wrapper, view: result }
}

describe('useViewMode', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('usa la lista si el usuario nunca eligió una vista', () => {
    const { view } = mountViewMode()

    expect(view.viewMode.value).toBe('list')
  })

  it('recupera la vista Kanban guardada y descarta valores que no son vistas', () => {
    window.localStorage.setItem(viewModeStorageKey, 'kanban')
    expect(mountViewMode().view.viewMode.value).toBe('kanban')

    window.localStorage.setItem(viewModeStorageKey, 'tablero-raro')
    expect(mountViewMode().view.viewMode.value).toBe('list')
  })

  it('guarda en localStorage la vista que elige el usuario', () => {
    const { view } = mountViewMode()

    view.setViewMode('kanban')

    expect(view.viewMode.value).toBe('kanban')
    expect(window.localStorage.getItem(viewModeStorageKey)).toBe('kanban')
  })

  it('sigue el cambio de vista hecho en otra pestaña', async () => {
    const { view } = mountViewMode()

    window.localStorage.setItem(viewModeStorageKey, 'kanban')
    window.dispatchEvent(new StorageEvent('storage', { key: viewModeStorageKey, newValue: 'kanban' }))

    expect(view.viewMode.value).toBe('kanban')
  })
})
