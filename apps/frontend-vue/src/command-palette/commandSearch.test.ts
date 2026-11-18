import { describe, expect, it } from 'vitest'
import { flattenGroups, maxResultsPerCategory, moveActiveIndex, normalizeText, scoreCommand, searchCommands, type CommandItem } from './commandSearch'

const items: CommandItem[] = [
  { id: 'nav:tareas', category: 'Vistas', label: 'Tareas', keywords: ['lista'] },
  { id: 'nav:ajustes', category: 'Vistas', label: 'Ajustes', keywords: ['configuración'] },
  { id: 'act:nueva', category: 'Acciones', label: 'Nueva tarea', keywords: ['crear'] },
  { id: 'task:1', category: 'Tareas', label: 'Abrir: Comprar pan', hint: 'Pendiente' },
  { id: 'friend:1', category: 'Amigos', label: 'Mensaje a ana#1234', hint: 'Iniciar DM' },
]

describe('normalizeText', () => {
  it('quita tildes, pasa a minúsculas y recorta espacios', () => {
    expect(normalizeText('  Configuración  ')).toBe('configuracion')
  })
})

describe('scoreCommand', () => {
  it('puntúa más alto cuando el nombre empieza por el término', () => {
    const starts = scoreCommand(items[0], 'tar')
    const contains = scoreCommand(items[2], 'tar')

    expect(starts).toBeGreaterThan(contains)
    expect(contains).toBeGreaterThan(0)
  })

  it('encuentra un comando por sinónimo y por estado de tarea', () => {
    expect(scoreCommand(items[1], 'configuracion')).toBeGreaterThan(0)
    expect(scoreCommand(items[3], 'pendiente')).toBeGreaterThan(0)
  })

  it('acepta letras en orden aunque no sean consecutivas', () => {
    expect(scoreCommand(items[2], 'nvt')).toBeGreaterThan(0)
  })

  it('exige que cada palabra de la consulta coincida', () => {
    expect(scoreCommand(items[2], 'nueva tarea')).toBeGreaterThan(0)
    expect(scoreCommand(items[2], 'nueva ajustes')).toBe(0)
  })

  it('devuelve 1 con consulta vacía para que todo el catálogo se muestre', () => {
    expect(scoreCommand(items[0], '   ')).toBe(1)
  })
})

describe('searchCommands', () => {
  it('agrupa en el orden fijo Acciones, Vistas, Tareas, Amigos y omite las secciones vacías', () => {
    const groups = searchCommands(items, '')

    expect(groups.map((group) => group.category)).toEqual(['Acciones', 'Vistas', 'Tareas', 'Amigos'])
  })

  it('filtra por la consulta y descarta lo que no coincide', () => {
    const groups = searchCommands(items, 'ana')

    expect(flattenGroups(groups).map((item) => item.id)).toEqual(['friend:1'])
  })

  it('limita cada sección al tope configurado', () => {
    const many: CommandItem[] = Array.from({ length: maxResultsPerCategory + 5 }, (_, index) => ({
      id: `task:${index}`,
      category: 'Tareas',
      label: `Tarea ${index}`,
    }))

    expect(searchCommands(many, '')[0].items).toHaveLength(maxResultsPerCategory)
  })
})

describe('moveActiveIndex', () => {
  it('avanza y retrocede dando la vuelta en los extremos', () => {
    expect(moveActiveIndex(0, 3, 1)).toBe(1)
    expect(moveActiveIndex(2, 3, 1)).toBe(0)
    expect(moveActiveIndex(0, 3, -1)).toBe(2)
  })

  it('arranca desde el primero o el último cuando aún no hay selección', () => {
    expect(moveActiveIndex(-1, 3, 1)).toBe(0)
    expect(moveActiveIndex(-1, 3, -1)).toBe(2)
  })

  it('devuelve -1 cuando no hay resultados', () => {
    expect(moveActiveIndex(0, 0, 1)).toBe(-1)
  })
})
