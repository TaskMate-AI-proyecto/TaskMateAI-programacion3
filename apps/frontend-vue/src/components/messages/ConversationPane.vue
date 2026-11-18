<script setup lang="ts">
import { ref, watch } from 'vue'
import { isMine, timeLabel } from '../../messages/messageUtils'
import { avatarInitials } from '../../settings/settings'
import type { DirectMessage, MessageContact } from '../../types/api'
import { cn } from '../../utils/cn'
import MessageComposer from './MessageComposer.vue'

// Panel central: cabecera del contacto, historial con scroll automático al último mensaje y la caja de entrada.
const props = defineProps<{
  contact: MessageContact | null
  messages: DirectMessage[]
  meId: string
  error: string | null
  draft: string
  sending: boolean
}>()

const emit = defineEmits<{ 'update:draft': [value: string]; submit: [] }>()

const listRef = ref<HTMLDivElement | null>(null)

// Tras cada cambio de mensajes o de contacto, la lista baja al último mensaje.
watch(
  () => [props.messages.length, props.contact?.id],
  () => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  },
  { flush: 'post' },
)
</script>

<template>
  <section v-if="!contact" class="grid place-items-center p-8 text-center text-sm text-slate-400">
    Selecciona un contacto para empezar a escribir.
  </section>

  <section v-else :aria-label="`Conversación con ${contact.email}`" class="flex min-h-0 flex-col">
    <header class="flex items-center gap-3 border-b border-glass/10 p-4">
      <span aria-hidden class="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
        {{ avatarInitials('', contact.email) }}
      </span>
      <p class="truncate font-semibold text-slate-100">{{ contact.email }}</p>
    </header>

    <div ref="listRef" class="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
      <p v-if="messages.length === 0" class="text-center text-sm text-slate-400">Aún no hay mensajes. Escribe el primero.</p>
      <template v-else>
      <div v-for="message in messages" :key="message.id" :class="cn('flex', isMine(message, meId) ? 'justify-end' : 'justify-start')">
        <div :class="cn('max-w-[75%] rounded-2xl border px-4 py-2.5 text-sm', isMine(message, meId) ? 'border-indigo-400/30 bg-indigo-500/25 text-indigo-950 dark:text-indigo-50' : 'border-glass/10 bg-glass/5 text-slate-100')">
          <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
          <p class="mt-1 text-right text-[11px] text-slate-500">
            {{ timeLabel(message.createdAt) }}{{ isMine(message, meId) && message.readAt ? ' · Leído' : '' }}
          </p>
        </div>
      </div>
      </template>
    </div>

    <p v-if="error" aria-live="polite" class="px-5 pb-2 text-sm text-coral">{{ error }}</p>
    <MessageComposer :draft="draft" :sending="sending" @submit="emit('submit')" @update:draft="emit('update:draft', $event)" />
  </section>
</template>
