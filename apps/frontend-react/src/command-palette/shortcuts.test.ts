import { afterEach, describe, expect, it } from 'vitest'
import { chordTimeoutMs, hasOpenDialog, isEditableTarget, isPaletteShortcut, resolveKey } from './shortcuts'

describe('isPaletteShortcut', () => {
  it('acepta Ctrl+K en Windows/Linux y Cmd+K en macOS, sin distinguir mayúsculas', () => {
    expect(isPaletteShortcut({ key: 'k', ctrlKey: true, metaKey: false })).toBe(true)
    expect(isPaletteShortcut({ key: 'K', ctrlKey: false, metaKey: true })).toBe(true)
  })

  it('ignora la tecla k sin modificador', () => {
    expect(isPaletteShortcut({ key: 'k', ctrlKey: false, metaKey: false })).toBe(false)
  })
})

describe('resolveKey', () => {
  it('arma el atajo con "g" y elige la sección con la letra siguiente', () => {
    const armed = resolveKey(null, 'g', 1000)
    expect(armed).toEqual({ commandId: null, armedAt: 1000 })

    expect(resolveKey(armed.armedAt, 't', 1200)).toEqual({ commandId: 'nav:tareas', armedAt: null })
  })

  it('cancela el atajo si pasa el tiempo de espera', () => {
    const armed = resolveKey(null, 'g', 1000)

    expect(resolveKey(armed.armedAt, 't', 1000 + chordTimeoutMs)).toEqual({ commandId: null, armedAt: null })
  })

  it('devuelve null para una letra que no tiene sección', () => {
    const armed = resolveKey(null, 'g', 0)

    expect(resolveKey(armed.armedAt, 'z', 10)).toEqual({ commandId: null, armedAt: null })
  })

  it('dispara "n" como nueva tarea sin necesidad de "g"', () => {
    expect(resolveKey(null, 'n', 0)).toEqual({ commandId: 'act:nueva-tarea', armedAt: null })
  })
})

describe('isEditableTarget y hasOpenDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reconoce campos de texto y no los trata como atajos', () => {
    const input = document.createElement('input')
    const div = document.createElement('div')

    expect(isEditableTarget(input)).toBe(true)
    expect(isEditableTarget(div)).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })

  it('detecta un diálogo modal abierto', () => {
    expect(hasOpenDialog()).toBe(false)

    const dialog = document.createElement('div')
    dialog.setAttribute('aria-modal', 'true')
    document.body.append(dialog)

    expect(hasOpenDialog()).toBe(true)
  })
})
