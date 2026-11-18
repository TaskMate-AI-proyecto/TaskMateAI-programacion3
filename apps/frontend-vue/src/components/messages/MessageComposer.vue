<script setup lang="ts">
import { Send } from 'lucide-vue-next'
import { maxMessageLength } from '../../messages/messageUtils'
import { eventValue } from '../../utils/events'

// Caja de entrada: un campo de vidrio y el botón de enviar.
defineProps<{ draft: string; sending: boolean }>()

const emit = defineEmits<{ 'update:draft': [value: string]; submit: [] }>()
</script>

<template>
  <form class="flex gap-2 border-t border-glass/10 p-4" @submit.prevent="emit('submit')">
    <input
      aria-label="Mensaje"
      class="settings-field min-w-0 flex-1"
      :maxlength="maxMessageLength"
      placeholder="Escribe un mensaje…"
      type="text"
      :value="draft"
      @input="emit('update:draft', eventValue($event))"
    />
    <button :disabled="sending || draft.trim() === ''" class="command-button shrink-0 disabled:opacity-60" type="submit">
      <Send :size="16" />Enviar
    </button>
  </form>
</template>
