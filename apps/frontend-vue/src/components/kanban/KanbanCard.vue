<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, UserRound } from 'lucide-vue-next'
import { avatarInitials } from '../../settings/settings'
import type { Task, TaskStatus } from '../../types/api'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles } from '../../utils/taskUtils'
import Badge from '../ui/Badge.vue'
import { isKanbanStatus, kanbanColumns } from './kanbanUtils'

// Hover con elevación; al arrastrar la tarjeta se encoge y brilla con sombra neón.
const cardClass = 'glass-card flex cursor-grab flex-col gap-3 p-3 transition duration-200 hover:-translate-y-1 hover:shadow-lg active:cursor-grabbing'
const draggingClass = 'opacity-70 scale-95 shadow-[0_0_24px_-4px_rgba(139,92,246,0.7)]'
const selectClass = 'w-full rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-200 disabled:opacity-50'

const props = defineProps<{ task: Task; isDragging: boolean; isPending: boolean; hasLanded: boolean }>()

const emit = defineEmits<{
  dragstart: [event: DragEvent, task: Task]
  dragend: []
  move: [task: Task, status: TaskStatus]
}>()

const done = computed(() => props.task.status === 'COMPLETED')
const dueTone = computed(() => (isOverdue(props.task) ? 'font-semibold text-coral' : 'text-slate-400'))
const classes = computed(() => [cardClass, props.isDragging ? draggingClass : '', props.hasLanded ? 'kanban-drop' : ''])

// Alternativa a arrastrar para pantallas táctiles y teclado: elegir la columna desde la tarjeta.
function onColumnChange(event: Event) {
  const target = event.target
  if (target instanceof HTMLSelectElement && isKanbanStatus(target.value)) emit('move', props.task, target.value)
}
</script>

<template>
  <li
    :aria-busy="isPending"
    :class="classes"
    :draggable="!isPending"
    @dragend="emit('dragend')"
    @dragstart="emit('dragstart', $event, task)"
  >
    <div class="flex items-start justify-between gap-2">
      <h3 :class="['min-w-0 break-words font-semibold', done ? 'text-slate-500 line-through' : 'text-slate-100']">{{ task.title }}</h3>
      <Badge :tone="priorityStyles[task.priority]">{{ priorityLabels[task.priority] }}</Badge>
    </div>
    <div class="flex items-center justify-between gap-2">
      <span v-if="task.dueDate" :class="['inline-flex items-center gap-1 text-xs', dueTone]">
        <CalendarDays aria-hidden :size="12" />
        {{ formatDueDate(task.dueDate) }}
      </span>
      <span v-if="!task.assignedUsers?.length" class="ml-auto grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-white/10 text-slate-300" title="Tarea personal">
        <UserRound aria-label="Tarea personal" :size="14" />
      </span>
      <span v-else class="ml-auto flex -space-x-2">
        <span
          v-for="user in task.assignedUsers"
          :key="user.id"
          aria-hidden
          class="grid h-6 w-6 place-items-center rounded-full border border-white/40 bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white"
          :title="user.email"
        >
          {{ avatarInitials('', user.email) }}
        </span>
      </span>
    </div>
    <select
      :aria-label="`Mover ${task.title} a columna`"
      :class="selectClass"
      :disabled="isPending"
      :value="task.status"
      @change="onColumnChange"
    >
      <option v-for="column in kanbanColumns" :key="column.status" :value="column.status">{{ column.label }}</option>
    </select>
  </li>
</template>
