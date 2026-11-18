<script setup lang="ts">
import { ClipboardList, Plus, SearchX } from 'lucide-vue-next'
import type { Task } from '../../types/api'
import TaskCard from './TaskCard.vue'

defineProps<{ tasks: Task[]; isLoading: boolean; hasFilters: boolean; pendingId: string | null }>()

defineEmits<{
  create: []
  'clear-filters': []
  toggle: [task: Task]
  edit: [task: Task]
  delete: [task: Task]
}>()
</script>

<template>
  <ul v-if="isLoading" aria-busy="true" aria-label="Cargando tareas" class="space-y-3">
    <li v-for="item in 3" :key="item" class="glass-card flex animate-pulse gap-3 p-4">
      <div class="h-6 w-6 rounded-full bg-slate-800/70" />
      <div class="flex-1 space-y-2.5">
        <div class="h-4 w-1/3 rounded bg-slate-800/70" />
        <div class="h-3 w-3/4 rounded bg-slate-800/70" />
        <div class="h-3 w-1/4 rounded bg-slate-800/70" />
      </div>
    </li>
  </ul>

  <div v-else-if="tasks.length === 0 && hasFilters" class="empty-state rounded-md">
    <SearchX :size="28" />
    <p>Ninguna tarea coincide con los filtros.</p>
    <button class="text-link text-sm" type="button" @click="$emit('clear-filters')">Limpiar filtros</button>
  </div>

  <div v-else-if="tasks.length === 0" class="empty-state rounded-md">
    <ClipboardList :size="28" />
    <p>Aún no tienes tareas. Crea la primera para empezar.</p>
    <button class="command-button" type="button" @click="$emit('create')"><Plus :size="16" />Nueva tarea</button>
  </div>

  <ul v-else class="space-y-3">
    <TaskCard
      v-for="task in tasks"
      :key="task.id"
      :is-busy="pendingId === task.id"
      :task="task"
      @delete="$emit('delete', $event)"
      @edit="$emit('edit', $event)"
      @toggle="$emit('toggle', $event)"
    />
  </ul>
</template>
