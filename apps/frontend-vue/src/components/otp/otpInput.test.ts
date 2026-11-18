import { describe, expect, it } from 'vitest'
import { clearDigit, codeOf, emptyDigits, isComplete, nextIndex, onlyDigits, pasteDigits, previousIndex, writeDigit } from './otpInput'

describe('otpInput', () => {
  it('empieza con seis casillas vacías y sólo acepta dígitos', () => {
    expect(emptyDigits()).toHaveLength(6)
    expect(onlyDigits('a1-2 3b')).toBe('123')
  })

  it('escribe el último dígito en la casilla indicada', () => {
    expect(writeDigit(emptyDigits(), 0, '42')).toEqual(['2', '', '', '', '', ''])
    expect(writeDigit(emptyDigits(), 0, 'x')).toEqual(['', '', '', '', '', ''])
  })

  it('reparte un texto pegado desde la casilla indicada y lo ignora si no son dígitos', () => {
    expect(pasteDigits(emptyDigits(), 0, '12 34-56')).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(pasteDigits(['9', '', '', '', '', ''], 2, '78')).toEqual(['9', '', '7', '8', '', ''])
  })

  it('limpia una casilla y detecta el código completo', () => {
    expect(clearDigit(['1', '2', '', '', '', ''], 1)).toEqual(['1', '', '', '', '', ''])
    expect(isComplete(['1', '2', '3', '4', '5', '6'])).toBe(true)
    expect(isComplete(['1', '2', '3', '4', '5', ''])).toBe(false)
    expect(codeOf(['1', '2', '3', '4', '5', '6'])).toBe('123456')
  })

  it('no sale de los límites al moverse', () => {
    expect(nextIndex(5)).toBe(5)
    expect(previousIndex(0)).toBe(0)
  })
})
