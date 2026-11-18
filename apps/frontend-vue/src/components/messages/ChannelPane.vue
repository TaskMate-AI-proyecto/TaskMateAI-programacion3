<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getApiErrorMessage } from '../../api/errors'
import { getGroupMessages, sendGroupMessage } from '../../api/messagesApi'
import { isMine, pollIntervalMs, timeLabel } from '../../messages/messageUtils'
import type { DirectMessage, Workspace } from '../../types/api'

// Canal grupal exclusivo de un espacio: historial compartido por sus miembros y caja de entrada.
const props = defineProps<{ workspace: Workspace; meId: string }>()

const messages = ref<DirectMessage[]>([])
const error = ref<string | null>(null)
const draft = ref('')
const sending = ref(false)
let timer: number | undefined

async function load() {
  try {
    messages.value = await getGroupMessages(props.workspace.id)
    error.value = null
  } catch (err) {
    error.value = getApiErrorMessage(err, 'No se pudo cargar el canal.')
  }
}

async function submit() {
  const content = draft.value.trim()
  if (!content || sending.value) return

  sending.value = true
  try {
    messages.value = [...messages.value, await sendGroupMessage(props.workspace.id, content)]
    draft.value = ''
  } catch (err) {
    error.value = getApiErrorMessage(err, 'No se pudo enviar el mensaje.')
  } finally {
    sending.value = false
  }
}

watch(() => props.workspace.id, () => void load())

onMounted(() => {
  void load()
  timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') void load()
  }, pollIntervalMs)
})

onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <section :aria-label="`Canal de ${workspace.name}`" class="flex min-h-0 flex-col">
    <header class="flex items-center gap-3 border-b border-glass/10 px-5 py-4">
      <span aria-hidden class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: workspace.color }" />
      <div>
        <p class="font-semibold text-slate-100">{{ workspace.name }}</p>
        <p class="text-xs text-slate-400">Canal del espacio · {{ workspace.memberCount }} miembros</p>
      </div>
    </header>

    <div class="flex-1 space-y-3 overflow-y-auto px-5 py-4">
      <p v-if="error" class="text-sm text-coral" role="alert">{{ error }}</p>
      <p v-if="messages.length === 0" class="text-sm text-slate-400">Todavía no hay mensajes en este espacio.</p>
      <div v-for="message in messages" :key="message.id" :class="['flex', isMine(message, meId) ? 'justify-end' : 'justify-start']">
        <div
          :class="[
            'max-w-[75%] rounded-2xl border px-4 py-2.5 text-sm',
            isMine(message, meId) ? 'border-indigo-400/30 bg-indigo-500/25 text-indigo-950 dark:text-indigo-50' : 'border-glass/10 bg-glass/5 text-slate-100',
          ]"
        >
          <p v-if="!isMine(message, meId)" class="mb-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">{{ message.sender?.uniqueTag ?? 'Miembro' }}</p>
          <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
          <p class="mt-1 text-right text-[11px] text-slate-500">{{ timeLabel(message.createdAt) }}</p>
        </div>
      </div>
    </div>

    <form class="flex gap-2 border-t border-glass/10 p-4" @submit.prevent="submit">
      <input v-model="draft" aria-label="Mensaje al espacio" class="settings-field min-w-0 flex-1" maxlength="2000" :placeholder="`Escribe a ${workspace.name}…`" type="text" />
      <button :disabled="sending || !draft.trim()" class="command-button" type="submit">Enviar</button>
    </form>
  </section>
</template>
