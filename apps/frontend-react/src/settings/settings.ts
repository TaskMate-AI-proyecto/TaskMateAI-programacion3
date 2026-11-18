// Ajustes del usuario en este navegador. Mismo módulo en la app React y en la Vue.
export type SettingsTab = 'profile' | 'assistant' | 'appearance' | 'security'
export type Personality = 'professional' | 'concise' | 'technical' | 'motivational'
export type AccentName = 'purple' | 'cyan' | 'emerald' | 'pink'

export interface AppSettings {
  displayName: string
  personality: Personality
  customInstructions: string
  accent: AccentName
}

export interface AssistantStyle {
  personality: Personality
  instructions?: string
}

export const settingsStorageKey = 'taskmate.settings'
// Misma clave que usa el historial del chat: limpiar el historial borra esta entrada.
export const chatStorageKey = 'taskmate.chat-threads'
export const maxDisplayNameLength = 40
export const maxInstructionsLength = 500
const settingsEvent = 'taskmate:settings'
const personalityValues: readonly Personality[] = ['professional', 'concise', 'technical', 'motivational']
const accentValues: readonly AccentName[] = ['purple', 'cyan', 'emerald', 'pink']

export const defaultSettings: AppSettings = {
  displayName: '',
  personality: 'professional',
  customInstructions: '',
  accent: 'purple',
}

export const personalityOptions: { value: Personality; label: string; hint: string }[] = [
  { value: 'professional', label: 'Profesional', hint: 'Cordial y claro' },
  { value: 'concise', label: 'Conciso', hint: 'Respuestas muy cortas' },
  { value: 'technical', label: 'Técnico', hint: 'Detalles de implementación' },
  { value: 'motivational', label: 'Motivador', hint: 'Tono positivo y animoso' },
]

export const accentOptions: { value: AccentName; label: string; swatch: string }[] = [
  { value: 'cyan', label: 'Cian', swatch: '#06b6d4' },
  { value: 'purple', label: 'Púrpura', swatch: '#6366f1' },
  { value: 'emerald', label: 'Esmeralda', swatch: '#10b981' },
  { value: 'pink', label: 'Rosa', swatch: '#ec4899' },
]

// Índigo y violeta de la app según el acento. Se aplican como variables CSS que leen los tokens de Tailwind.
const indigoShades: Record<AccentName, Record<number, string>> = {
  purple: { 50: '#eef2ff', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 950: '#1e1b4b' },
  cyan: { 50: '#ecfeff', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 950: '#083344' },
  emerald: { 50: '#ecfdf5', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 950: '#022c22' },
  pink: { 50: '#fdf2f8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 950: '#500724' },
}

const violetShades: Record<AccentName, Record<number, string>> = {
  purple: { 500: '#8b5cf6', 600: '#7c3aed' },
  cyan: { 500: '#06b6d4', 600: '#0891b2' },
  emerald: { 500: '#10b981', 600: '#059669' },
  pink: { 500: '#ec4899', 600: '#db2777' },
}

function toTriplet(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16)

  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`
}

// Aplica el acento a las variables globales --indigo-* y --violet-* (los tokens de Tailwind las leen).
export function applyAccent(accent: AccentName) {
  const style = document.documentElement.style

  Object.entries(indigoShades[accent]).forEach(([shade, hex]) => style.setProperty(`--indigo-${shade}`, toTriplet(hex)))
  Object.entries(violetShades[accent]).forEach(([shade, hex]) => style.setProperty(`--violet-${shade}`, toTriplet(hex)))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function pickString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function pickOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.find((option) => option === value) ?? fallback
}

// Valida lo que llega del almacenamiento: un valor corrupto o antiguo nunca rompe la app.
export function normalizeSettings(raw: unknown): AppSettings {
  const source: Record<string, unknown> = isRecord(raw) ? raw : {}

  return {
    displayName: pickString(source.displayName, '').slice(0, maxDisplayNameLength),
    personality: pickOption(source.personality, personalityValues, defaultSettings.personality),
    customInstructions: pickString(source.customInstructions, '').slice(0, maxInstructionsLength),
    accent: pickOption(source.accent, accentValues, defaultSettings.accent),
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(settingsStorageKey)

    return normalizeSettings(raw === null ? null : JSON.parse(raw))
  } catch {
    return normalizeSettings(null)
  }
}

// Guarda, aplica el acento y avisa a todas las vistas suscritas. Devuelve los ajustes normalizados.
export function saveSettings(changes: AppSettings): AppSettings {
  const next = normalizeSettings(changes)

  try {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(next))
  } catch {
    // Sin almacenamiento los ajustes duran hasta recargar la página.
  }

  applyAccent(next.accent)
  window.dispatchEvent(new CustomEvent<AppSettings>(settingsEvent, { detail: next }))

  return next
}

export function onSettingsChange(listener: (settings: AppSettings) => void) {
  const handler = (event: Event) => {
    if (event instanceof CustomEvent && isRecord(event.detail)) listener(normalizeSettings(event.detail))
  }

  window.addEventListener(settingsEvent, handler)

  return () => window.removeEventListener(settingsEvent, handler)
}

export function applyStoredSettings() {
  applyAccent(loadSettings().accent)
}

export function assistantStyle(settings: AppSettings): AssistantStyle {
  const instructions = settings.customInstructions.trim()

  return { personality: settings.personality, ...(instructions ? { instructions } : {}) }
}

// Borra el historial del chat guardado en este navegador.
export function clearChatHistory() {
  try {
    window.localStorage.removeItem(chatStorageKey)
  } catch {
    // Sin almacenamiento no hay historial que borrar.
  }
}

// Iniciales para el avatar: dos palabras del nombre, o la primera letra del correo si no hay nombre.
export function avatarInitials(displayName: string, email: string) {
  const words = displayName.trim().split(/\s+/).filter(Boolean)
  const initials = words.length > 0 ? words.slice(0, 2).map((word) => word[0]).join('') : (email.trim()[0] ?? '?')

  return initials.toUpperCase()
}
