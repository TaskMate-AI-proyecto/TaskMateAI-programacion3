<script setup lang="ts">
import { computed, ref } from 'vue'
import { Send } from 'lucide-vue-next'

const props = defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const draft = ref('')
const canSend = computed(() => !props.disabled && draft.value.trim().length > 0)

// Se limpia sólo cuando el mensaje se envía.
function handleSubmit() {
  if (!canSend.value) return

  emit('send', draft.value)
  draft.value = ''
}
</script>

<template>
  <form
    class="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 p-1.5 pl-4 backdrop-blur-xl"
    @submit.prevent="handleSubmit"
  >
    <input
      v-model="draft"
      aria-label="Mensaje para TaskMate AI"
      class="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
      placeholder="Escribe un mensaje…"
      type="text"
    />
    <button
      :disabled="!canSend"
      aria-label="Enviar mensaje"
      class="command-button h-10 w-10 justify-center rounded-full p-0 transition hover:scale-105 active:scale-95 disabled:opacity-50"
      type="submit"
    >
      <Send :size="16" />
    </button>
  </form>
</template>
