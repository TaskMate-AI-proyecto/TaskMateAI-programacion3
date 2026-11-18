<script setup lang="ts">
import type { Workspace } from '../../types/api'

// Canales grupales: uno por espacio del usuario. Elegir uno lo activa también en la barra lateral.
defineProps<{ workspaces: Workspace[]; activeId?: string }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <section v-if="workspaces.length > 0" aria-label="Canales de espacios" class="border-b border-glass/10 p-3">
    <p class="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Espacios</p>
    <ul class="space-y-1">
      <li v-for="workspace in workspaces" :key="workspace.id">
        <button
          :aria-pressed="workspace.id === activeId"
          :class="workspace.id === activeId ? 'bg-indigo-500/15 text-slate-100' : 'text-slate-400 hover:bg-glass/5 hover:text-slate-100'"
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition"
          type="button"
          @click="emit('select', workspace.id)"
        >
          <span aria-hidden class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: workspace.color }" />
          <span class="truncate">{{ workspace.name }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>
