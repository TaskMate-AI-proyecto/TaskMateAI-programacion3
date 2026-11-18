import { describe, expect, it } from 'vitest'
import { inlineSegments, parseAiText } from './aiText'

describe('parseAiText', () => {
  it('separa párrafos por líneas en blanco', () => {
    expect(parseAiText('Primer párrafo.\nMás texto.\n\nSegundo.')).toEqual([
      { kind: 'paragraph', text: 'Primer párrafo. Más texto.' },
      { kind: 'paragraph', text: 'Segundo.' },
    ])
  })

  it('convierte listas numeradas y con viñetas en bloques propios', () => {
    expect(parseAiText('Pasos:\n1. Leer\n2. Resumir\n- Repasar\n* Practicar')).toEqual([
      { kind: 'paragraph', text: 'Pasos:' },
      { kind: 'list', ordered: true, items: ['Leer', 'Resumir'] },
      { kind: 'list', ordered: false, items: ['Repasar', 'Practicar'] },
    ])
  })

  it('une las líneas sangradas al ítem anterior y quita los encabezados Markdown', () => {
    expect(parseAiText('## Resumen\n1. **Revisar**\n   Prioridad alta')).toEqual([
      { kind: 'paragraph', text: 'Resumen' },
      { kind: 'list', ordered: true, items: ['**Revisar** Prioridad alta'] },
    ])
  })

  it('no devuelve bloques para un texto vacío', () => {
    expect(parseAiText('   \n\n')).toEqual([])
  })
})

describe('inlineSegments', () => {
  it('marca la negrita y no deja asteriscos sueltos', () => {
    expect(inlineSegments('Haz **esto** ya')).toEqual([
      { text: 'Haz ', bold: false },
      { text: 'esto', bold: true },
      { text: ' ya', bold: false },
    ])
  })

  it('no muestra un ** sin cerrar', () => {
    expect(inlineSegments('Texto **suelto')).toEqual([
      { text: 'Texto ', bold: false },
      { text: 'suelto', bold: true },
    ])
  })
})
