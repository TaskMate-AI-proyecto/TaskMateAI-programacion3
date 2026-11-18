<script setup lang="ts">
import type { Task, TaskStatus } from '../../types/api'
import KanbanCard from './KanbanCard.vue'
import type { KanbanColumnConfig } from './kanbanUtils'

// Columna glassy V5; en pantallas pequeñas el tablero entero hace scroll horizontal con ajuste por columna.
const columnClass = 'flex min-w-[280px] flex-1 snap-start flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition'
const overClass = 'ring-2 ring-indigo-400/70 bg-indigo-500/10'

defineProps<{
  column: KanbanColumnConfig
  tasks: Task[]
  isOver: boolean
  draggingId: string | null
  landedId: string | null
  pendingId: string | null
}>()

const emit = defineEmits<{
  dragstart: [event: DragEvent, task: Task]
  dragend: []
  dragover: [event: DragEvent, status: TaskStatus]
  dragleave: [event: DragEvent, status: TaskStatus]
  drop: [event: DragEvent, status: TaskStatus]
  move: [task: Task, status: TaskStatus]
}>()
</script>

<template>
  <section
    :aria-label="column.label"
    :class="[columnClass, isOver ? overClass : '']"
    @dragleave="emit('dragleave', $event, column.status)"
    @dragover="emit('dragover', $event, column.status)"
    @drop="emit('drop', $event, column.status)"
  >
    <header class="flex items-center justify-between gap-2">
      <h2 class="font-display text-lg font-semibold text-slate-100">{{ column.label }}</h2>
      <span class="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-300">{{ tasks.length }}</span>
    </header>
    <ul class="flex min-h-24 flex-col gap-3">
      <KanbanCard
        v-for="task in tasks"
        :key="task.id"
        :has-landed="landedId === task.id"
        :is-dragging="draggingId === task.id"
        :is-pending="pendingId === task.id"
        :task="task"
        @dragend="emit('dragend')"
        @dragstart="(event, dragged) => emit('dragstart', event, dragged)"
        @move="(moved, status) => emit('move', moved, status)"
      />
    </ul>
    <p v-if="tasks.length === 0" class="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-slate-400">
      Suelta una tarea aquí
    </p>
  </section>
</template>
