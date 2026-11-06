<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
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
    class="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-md sm:items-center"
    @mousedown="handleOverlayClick"
  >
    <div
      aria-label="Dialog"
      aria-modal="true"
      class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-indigo-500/30 bg-slate-900/90 p-6 text-slate-100 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] backdrop-blur-md"
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
