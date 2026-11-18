import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadSettings, saveSettings, type AppSettings } from '../settings/settings'

// Ajustes compartidos entre vistas: un único estado reactivo que se guarda en localStorage al cambiar.
export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(loadSettings())

  function update(changes: Partial<AppSettings>) {
    settings.value = saveSettings({ ...settings.value, ...changes })
  }

  return { settings, update }
})
