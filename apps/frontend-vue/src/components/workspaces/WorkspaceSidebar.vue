<script setup lang="ts">
import { ChevronDown, ChevronRight, Layers, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useWorkspacesStore } from '../../stores/workspaces'
import WorkspaceModal from './WorkspaceModal.vue'

// Sección colapsable "Espacios" de la cápsula lateral: "Todos" o un espacio concreto, y el botón + para crear.
const workspaces = useWorkspacesStore()
const expanded = ref(true)
const creating = ref(false)

function chipClass(active: boolean) {
  return [
    'w-full px-2 py-1 rounded-full flex items-center justify-center gap-1 overflow-hidden border text-xs font-semibold transition',
    active ? 'border-indigo-400/60 bg-indigo-500/15 text-slate-100' : 'border-glass/10 bg-glass/5 text-slate-400 hover:text-slate-100',
  ]
}
</script>

<template>
    <section aria-label="Espacios" class="flex w-full flex-col items-center gap-2">
    <div class="flex w-full items-center justify-between px-1">
      <button :aria-expanded="expanded" aria-label="Espacios" class="nav-icon !h-5 !w-5 shrink-0" title="Espacios" type="button" @click="expanded = !expanded">
        <Layers :size="18" />
      </button>
      <component :is="expanded ? ChevronDown : ChevronRight" aria-hidden class="shrink-0 text-slate-500" :size="14" />
      <button aria-label="Nuevo espacio" class="nav-icon !h-5 !w-5 shrink-0" title="Nuevo espacio" type="button" @click="creating = true">
        <Plus :size="18" />
      </button>
    </div>
    <ul v-if="expanded" class="mx-auto flex w-full flex-col items-center gap-1.5 overflow-hidden">
      <li class="w-full">
        <button :aria-pressed="workspaces.selectedId === null" :class="chipClass(workspaces.selectedId === null)" title="Todos" type="button" @click="workspaces.select(null)">
          <span class="truncate">Todos</span>
        </button>
      </li>
      <li v-for="workspace in workspaces.workspaces" class="w-full" :key="workspace.id">
        <button
          :aria-pressed="workspaces.selectedId === workspace.id"
          :class="chipClass(workspaces.selectedId === workspace.id)"
          :title="workspace.name"
          type="button"
          @click="workspaces.select(workspace.id)"
        >
          <span aria-hidden class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: workspace.color }" />
          <span class="max-w-[28px] truncate text-[10px] font-semibold">{{ workspace.name }}</span>
        </button>
      </li>
    </ul>
    <WorkspaceModal v-if="creating" @close="creating = false" />
  </section>
</template>
