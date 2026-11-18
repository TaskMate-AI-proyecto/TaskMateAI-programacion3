<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  // Acabado del panel; por defecto, el de los modales de la app.
  panelClass?: string
  overlayClass?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const defaultPanelClass = 'max-w-lg rounded-md border border-indigo-500/30 bg-slate-900/90 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] backdrop-blur-md'

// Igual que la modal React: Escape cierra y la página de fondo no se desplaza mientras está abierta.
let previousOverflow = ''

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.body.style.overflow = previousOverflow
  window.removeEventListener('keydown', handleKeyDown)
})

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <div
    :class="props.overlayClass ?? 'fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-md sm:items-center'"
    @mousedown="handleOverlayClick"
  >
    <div
      :aria-label="title"
      aria-modal="true"
      :class="['max-h-[90vh] w-full overflow-y-auto p-6 text-slate-100', props.panelClass ?? defaultPanelClass]"
      role="dialog"
    >
      <div class="mb-5 flex items-center justify-between gap-4">
        <h2 class="font-display text-2xl font-semibold">{{ title }}</h2>
        <button
          aria-label="Cerrar"
          class="icon-button"
          type="button"
          @click="emit('close')"
        >
          <X aria-hidden :size="18" />
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>
