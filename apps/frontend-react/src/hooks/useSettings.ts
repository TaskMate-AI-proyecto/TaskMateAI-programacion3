import { useCallback, useEffect, useState } from 'react'
import { loadSettings, onSettingsChange, saveSettings, type AppSettings } from '../settings/settings'

// Ajustes compartidos entre vistas: cualquier cambio se guarda y todas las instancias lo reciben.
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => onSettingsChange(setSettings), [])

  const update = useCallback((changes: Partial<AppSettings>) => {
    saveSettings({ ...settings, ...changes })
  }, [settings])

  return { settings, update }
}
