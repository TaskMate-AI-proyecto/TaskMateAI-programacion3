<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'
import type { ChatThread } from '../../utils/chatUtils'
import { threadStatus } from '../../utils/chatUtils'

defineProps<{
  threads: ChatThread[]
  activeId: string | null
  search: string
}>()

const emit = defineEmits<{
  new: []
  search: [value: string]
  select: [id: string]
}>()
</script>

<template>
  <aside aria-label="Historial de conversaciones" class="glass-card flex min-h-[32rem] flex-col gap-4 p-4">
    <button class="command-button w-full justify-center" type="button" @click="emit('new')">
      <Plus :size="16" />
      Nueva conversación
    </button>

    <label class="relative block">
      <span class="sr-only">Buscar conversaciones</span>
      <Search aria-hidden class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" :size="16" />
      <input
        aria-label="Buscar conversaciones"
        class="w-full rounded-full border border-white/10 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-indigo-400"
        placeholder="Buscar en el historial"
        type="search"
        :value="search"
        @input="emit('search', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <ul class="flex flex-col gap-2 overflow-y-auto">
      <li v-for="thread in threads" :key="thread.id">
        <button
          :aria-current="thread.id === activeId ? 'true' : undefined"
          :class="[
            'w-full rounded-2xl border px-3 py-2.5 text-left transition',
            thread.id === activeId ? 'border-indigo-400/40 bg-white/10' : 'border-transparent hover:bg-white/5',
          ]"
          type="button"
          @click="emit('select', thread.id)"
        >
          <span class="block truncate text-sm font-medium text-slate-100">{{ thread.title }}</span>
          <span class="block text-xs text-slate-500">{{ threadStatus(thread) }}</span>
        </button>
      </li>
    </ul>

    <p v-if="threads.length === 0" class="text-sm text-slate-500">No hay conversaciones que coincidan.</p>
  </aside>
</template>
