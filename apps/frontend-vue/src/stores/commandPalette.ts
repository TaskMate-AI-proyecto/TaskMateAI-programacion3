import { defineStore } from 'pinia'
import { ref } from 'vue'

// Estado global de la paleta: la abren el atajo, el botón de la cápsula lateral y el propio cierre de sus comandos.
export const useCommandPaletteStore = defineStore('commandPalette', () => {
  const isOpen = ref(false)

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  return { isOpen, open, close, toggle }
})
