// Atajos globales de la paleta. Ctrl+K (Windows/Linux) o Cmd+K (macOS) la abren. Fuera de campos de texto,
// "g" seguida de una letra abre una sección y "n" crea una tarea. Son funciones puras: cada app pone su listener.
// Este archivo es idéntico en apps/frontend-react y apps/frontend-vue.

export const chordTimeoutMs = 1500

// Letra que sigue a "g" → id del comando de navegación.
export const navigationChords: ReadonlyMap<string, string> = new Map([
  ['i', 'nav:inicio'],
  ['t', 'nav:tareas'],
  ['k', 'nav:kanban'],
  ['m', 'nav:mensajes'],
  ['a', 'nav:amigos'],
  ['s', 'nav:ajustes'],
  ['l', 'nav:logros'],
  ['c', 'nav:chat'],
])

// Teclas sueltas que disparan un comando sin "g".
export const singleKeyCommands: ReadonlyMap<string, string> = new Map([['n', 'act:nueva-tarea']])

interface KeyLike {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}

export function isPaletteShortcut(event: Pick<KeyLike, 'key' | 'ctrlKey' | 'metaKey'>) {
  return event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)
}

export function hasModifier(event: Pick<KeyLike, 'ctrlKey' | 'metaKey' | 'altKey'>) {
  return event.ctrlKey || event.metaKey || event.altKey
}

// En campos de texto las letras son texto, no atajos.
export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

// Si hay otro diálogo abierto (un modal con aria-modal), los atajos de una letra no deben actuar debajo.
export function hasOpenDialog() {
  return document.querySelector('[aria-modal="true"]') !== null
}

export interface ChordStep {
  commandId: string | null
  armedAt: number | null
}

function isArmed(armedAt: number | null, now: number) {
  return armedAt !== null && now - armedAt < chordTimeoutMs
}

function lookup(commands: ReadonlyMap<string, string>, key: string) {
  return commands.get(key) ?? null
}

// "g" arma el atajo y la letra siguiente, dentro de 1,5 s, elige la sección. Sin armar, "n" dispara su comando.
export function resolveKey(armedAt: number | null, key: string, now: number): ChordStep {
  const letter = key.toLowerCase()

  if (isArmed(armedAt, now)) return { commandId: lookup(navigationChords, letter), armedAt: null }
  if (letter === 'g') return { commandId: null, armedAt: now }

  return { commandId: lookup(singleKeyCommands, letter), armedAt: null }
}
