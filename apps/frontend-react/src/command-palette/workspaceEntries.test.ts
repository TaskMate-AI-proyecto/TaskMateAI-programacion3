import { describe, expect, it, vi } from 'vitest'
import { workspaceEntries } from './paletteEntries'

describe('workspaceEntries', () => {
  it('no ofrece nada si el usuario no tiene espacios', () => {
    expect(workspaceEntries([], vi.fn())).toEqual([])
  })

  it('ofrece Todos y cada espacio, y cambia el espacio activo al ejecutarlos', () => {
    const select = vi.fn()
    const entries = workspaceEntries([{ id: 'ws-1', name: 'Proyecto final' }], select)

    expect(entries.map((entry) => entry.label)).toEqual(['Espacio: Todos', 'Espacio: Proyecto final'])
    expect(entries.every((entry) => entry.category === 'Espacios')).toBe(true)

    entries[1].run()
    expect(select).toHaveBeenLastCalledWith('ws-1')
    entries[0].run()
    expect(select).toHaveBeenLastCalledWith(null)
  })
})
