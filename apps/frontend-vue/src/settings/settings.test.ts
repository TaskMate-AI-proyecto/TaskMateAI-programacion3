import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyAccent,
  assistantStyle,
  avatarInitials,
  chatStorageKey,
  clearChatHistory,
  defaultSettings,
  loadSettings,
  normalizeSettings,
  onSettingsChange,
  saveSettings,
  settingsStorageKey,
} from './settings'

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('style')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('descarta valores inválidos y recorta los textos largos', () => {
    const settings = normalizeSettings({ displayName: 'x'.repeat(60), personality: 'sarcastic', accent: 'pink', customInstructions: 42 })

    expect(settings.displayName).toHaveLength(40)
    expect(settings.personality).toBe(defaultSettings.personality)
    expect(settings.accent).toBe('pink')
    expect(settings.customInstructions).toBe('')
  })

  it('carga los valores por defecto cuando el almacenamiento está vacío o corrupto', () => {
    expect(loadSettings()).toEqual(defaultSettings)

    localStorage.setItem(settingsStorageKey, '{no es json')
    expect(loadSettings()).toEqual(defaultSettings)
  })

  it('guarda, vuelve a leer y avisa a los suscriptores', () => {
    const listener = vi.fn()
    const stop = onSettingsChange(listener)

    const saved = saveSettings({ ...defaultSettings, displayName: 'Ana', personality: 'technical' })

    expect(loadSettings()).toEqual(saved)
    expect(listener).toHaveBeenCalledWith(saved)
    stop()
    saveSettings({ ...defaultSettings, displayName: 'Luis' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('aplica el acento como variables CSS globales', () => {
    applyAccent('cyan')

    expect(document.documentElement.style.getPropertyValue('--indigo-500')).toBe('6 182 212')
    expect(document.documentElement.style.getPropertyValue('--violet-600')).toBe('8 145 178')
  })

  it('genera el estilo del asistente sin instrucciones vacías', () => {
    expect(assistantStyle({ ...defaultSettings, customInstructions: '   ' })).toEqual({ personality: 'professional' })
    expect(assistantStyle({ ...defaultSettings, personality: 'concise', customInstructions: ' Sé breve ' })).toEqual({
      personality: 'concise',
      instructions: 'Sé breve',
    })
  })

  it('calcula las iniciales desde el nombre o, si falta, desde el correo', () => {
    expect(avatarInitials('ana maría López', 'ana@example.com')).toBe('AM')
    expect(avatarInitials('', 'luis@example.com')).toBe('L')
    expect(avatarInitials('', '')).toBe('?')
  })

  it('borra sólo el historial del chat', () => {
    localStorage.setItem(chatStorageKey, '[]')
    localStorage.setItem(settingsStorageKey, '{}')

    clearChatHistory()

    expect(localStorage.getItem(chatStorageKey)).toBeNull()
    expect(localStorage.getItem(settingsStorageKey)).toBe('{}')
  })
})
