import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  kind: ToastKind
}

const toastDuration = 4000

// Avisos efímeros: se retiran solos a los 4 segundos, como en la app React.
export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 0

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function notify(message: string, kind: ToastKind = 'success') {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, kind }]
    window.setTimeout(() => dismiss(id), toastDuration)
  }

  return { toasts, notify, dismiss }
})
