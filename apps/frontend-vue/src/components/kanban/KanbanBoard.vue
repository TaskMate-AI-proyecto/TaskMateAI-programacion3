<script setup lang="ts">
import { ref } from 'vue'
import type { Task, TaskStatus } from '../../types/api'
import KanbanColumn from './KanbanColumn.vue'
import { kanbanColumns, tasksInColumn } from './kanbanUtils'

const props = defineProps<{ tasks: Task[]; isLoading: boolean; pendingId: string | null }>()
const emit = defineEmits<{ move: [task: Task, status: TaskStatus] }>()

const dragDataType = 'text/plain'
const draggingId = ref<string | null>(null)
const overStatus = ref<TaskStatus | null>(null)
const landedId = ref<string | null>(null)

function clearDrag() {
  draggingId.value = null
  overStatus.value = null
}

function handleDragStart(event: DragEvent, task: Task) {
  const transfer = event.dataTransfer
  if (transfer) {
    transfer.setData(dragDataType, task.id)
    transfer.effectAllowed = 'move'
  }

  draggingId.value = task.id
  landedId.value = null
}

function handleDragOver(event: DragEvent, status: TaskStatus) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  overStatus.value = status
}

function handleDragLeave(event: DragEvent, status: TaskStatus) {
  const { currentTarget, relatedTarget } = event
  // Pasar sobre los hijos de la columna también dispara "dragleave": sólo se limpia al salir de ella.
  if (currentTarget instanceof Node && relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) return
  if (overStatus.value === status) overStatus.value = null
}

function handleDrop(event: DragEvent, status: TaskStatus) {
  event.preventDefault()
  const id = event.dataTransfer ? event.dataTransfer.getData(dragDataType) : ''
  const task = props.tasks.find((item) => item.id === id)
  clearDrag()
  if (!task || task.status === status) return

  landedId.value = task.id
  emit('move', task, status)
}
</script>

<template>
  <!-- Tablero de 4 columnas. Soltar una tarjeta en otra columna cambia su estado (la columna nueva lo define). -->
  <div v-if="isLoading" aria-busy="true" class="flex gap-4 overflow-x-auto pb-3">
    <div v-for="column in kanbanColumns" :key="column.status" class="min-w-[280px] flex-1 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="h-6 w-24 animate-pulse rounded-md bg-slate-800/70" />
      <div class="h-20 animate-pulse rounded-2xl bg-slate-800/70" />
    </div>
  </div>

  <div v-else aria-label="Tablero Kanban" class="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3" role="region">
    <KanbanColumn
      v-for="column in kanbanColumns"
      :key="column.status"
      :column="column"
      :dragging-id="draggingId"
      :is-over="overStatus === column.status"
      :landed-id="landedId"
      :pending-id="pendingId"
      :tasks="tasksInColumn(tasks, column.status)"
      @dragend="clearDrag"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @dragstart="handleDragStart"
      @drop="handleDrop"
      @move="(task, status) => emit('move', task, status)"
    />
  </div>
</template>
