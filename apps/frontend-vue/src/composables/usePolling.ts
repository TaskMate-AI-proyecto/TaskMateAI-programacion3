import { onBeforeUnmount, onMounted } from 'vue'

// Ejecuta callback cada intervalMs mientras la ventana está visible (sin recargar la página).
export function usePolling(callback: () => void, intervalMs: number) {
  let timer: number | undefined

  onMounted(() => {
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') callback()
    }, intervalMs)
  })

  onBeforeUnmount(() => window.clearInterval(timer))
}
