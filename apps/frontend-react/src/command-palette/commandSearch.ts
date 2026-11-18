// Motor de búsqueda de la paleta de comandos. Es TypeScript puro, sin React ni Vue ni dependencias:
// el mismo archivo vive en apps/frontend-react y en apps/frontend-vue (como theme.ts), así ambas paletas coinciden 1:1.

export type CommandCategory = 'Acciones' | 'Vistas' | 'Tareas' | 'Amigos' | 'Espacios'

// Orden fijo de las secciones en la lista.
export const commandCategories: readonly CommandCategory[] = ['Acciones', 'Vistas', 'Tareas', 'Amigos', 'Espacios']

// Tope por sección: con muchas tareas la lista sigue corta y la consulta hace el resto.
export const maxResultsPerCategory = 8

export interface CommandItem {
  id: string
  category: CommandCategory
  label: string
  // Texto secundario a la derecha del nombre (por ejemplo, el estado de una tarea).
  hint?: string
  // Atajo visible a la derecha, por ejemplo "G I".
  shortcut?: string
  // Sinónimos: permiten encontrar el comando con otras palabras.
  keywords?: string[]
}

export interface CommandGroup<T extends CommandItem> {
  category: CommandCategory
  items: T[]
}

// Minúsculas, sin tildes y sin espacios sobrantes: "Configuración" coincide con "configuracion".
export function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Cada letra del término aparece en orden dentro del texto: "nvt" encuentra "Nueva tarea".
function isSubsequence(text: string, term: string) {
  let position = 0

  for (const char of term) {
    position = text.indexOf(char, position)
    if (position === -1) return false
    position += 1
  }

  return true
}

// 3: empieza por el término · 2: lo contiene · 1: letras en orden · 0: no coincide.
function termScore(text: string, term: string) {
  if (text.startsWith(term)) return 3
  if (text.includes(term)) return 2
  return isSubsequence(text, term) ? 1 : 0
}

function commandFields(item: CommandItem) {
  const extra = [...(item.keywords ?? []), ...(item.hint ? [item.hint] : [])]

  return [item.label, ...extra].map(normalizeText)
}

function bestFieldScore(fields: string[], term: string) {
  return Math.max(0, ...fields.map((field) => termScore(field, term)))
}

function queryTerms(query: string) {
  return normalizeText(query).split(/\s+/).filter(Boolean)
}

// Cada palabra de la consulta debe coincidir con algún campo del comando; la puntuación suma las mejores coincidencias.
export function scoreCommand(item: CommandItem, query: string) {
  const terms = queryTerms(query)
  if (terms.length === 0) return 1

  const fields = commandFields(item)
  let total = 0

  for (const term of terms) {
    const best = bestFieldScore(fields, term)
    if (best === 0) return 0
    total += best
  }

  return total
}

function rankInCategory<T extends CommandItem>(items: T[], category: CommandCategory, query: string) {
  return items
    .filter((item) => item.category === category)
    .map((item) => ({ item, score: scoreCommand(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, maxResultsPerCategory)
    .map(({ item }) => item)
}

// Agrupa los resultados por sección, en el orden fijo de commandCategories. Las secciones vacías no aparecen.
export function searchCommands<T extends CommandItem>(items: T[], query: string): CommandGroup<T>[] {
  return commandCategories
    .map((category) => ({ category, items: rankInCategory(items, category, query) }))
    .filter((group) => group.items.length > 0)
}

// Lista plana en el orden en que se ve: es la que recorren las flechas.
export function flattenGroups<T extends CommandItem>(groups: CommandGroup<T>[]) {
  return groups.flatMap((group) => group.items)
}

// Siguiente posición con vuelta: pasar del último lleva al primero y al revés. Sin resultados devuelve -1.
export function moveActiveIndex(current: number, total: number, step: 1 | -1) {
  if (total === 0) return -1
  if (current < 0) return step === 1 ? 0 : total - 1

  return (current + step + total) % total
}
