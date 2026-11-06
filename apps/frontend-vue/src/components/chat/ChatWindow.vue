<script setup lang="ts">
import { computed } from 'vue'
import { Bot, Sparkles } from 'lucide-vue-next'
import type { ChatThread } from '../../utils/chatUtils'
import ChatBubble from './ChatBubble.vue'
import ChatComposer from './ChatComposer.vue'

const props = defineProps<{
  thread: ChatThread | null
  isSending: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const quickPrompts = [
  { label: 'Dividir tarea en pasos', prompt: 'Divide mi tarea más urgente en pasos concretos.' },
  { label: 'Resumir pendientes', prompt: 'Resume mis tareas pendientes.' },
]

const messages = computed(() => props.thread?.messages ?? [])
</script>

<template>
  <section aria-label="Conversación con TaskMate AI" class="glass-card flex min-h-[32rem] flex-col gap-4 p-5">
    <header class="flex items-center gap-3 border-b border-white/10 pb-4">
      <span class="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_20px_-4px_rgba(139,92,246,0.8)]">
        <Bot :size="20" />
      </span>
      <div>
        <p class="font-semibold text-slate-100">TaskMate AI</p>
        <p class="flex items-center gap-1.5 text-xs text-emerald-300">
          <span aria-hidden class="h-2 w-2 rounded-full bg-emerald-400" />
          Online
        </p>
      </div>
    </header>

    <div
      v-if="messages.length === 0"
      class="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-slate-400"
    >
      <Sparkles aria-hidden :size="24" />
      <p>Pregúntame por tus tareas: puedo dividirlas en pasos o resumir lo pendiente.</p>
    </div>

    <template v-else>
      <ol aria-label="Mensajes" class="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        <ChatBubble v-for="message in messages" :key="message.id" :message="message" />
      </ol>
      <p v-if="isSending" class="text-xs text-slate-400" role="status">TaskMate AI está escribiendo…</p>
    </template>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="chip in quickPrompts"
        :key="chip.label"
        :disabled="isSending"
        class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl transition hover:border-indigo-400/50 hover:bg-white/10 disabled:opacity-50"
        type="button"
        @click="emit('send', chip.prompt)"
      >
        {{ chip.label }}
      </button>
    </div>

    <ChatComposer :disabled="isSending" @send="emit('send', $event)" />
  </section>
</template>
