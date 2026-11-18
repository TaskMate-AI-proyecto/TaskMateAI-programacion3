<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Check, Pencil, Trash2 } from 'lucide-vue-next'
import type { Task } from '../../types/api'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles, statusLabels, statusStyles } from '../../utils/taskUtils'
import Badge from '../ui/Badge.vue'
import CollaborativeBadge from './CollaborativeBadge.vue'

const props = defineProps<{ task: Task; isBusy: boolean }>()

const emit = defineEmits<{ toggle: [task: Task]; edit: [task: Task]; delete: [task: Task] }>()

const done = computed(() => props.task.status === 'COMPLETED')
const overdue = computed(() => isOverdue(props.task))
const completionTone = computed(() => (done.value ? 'border-mint bg-mint text-white' : 'border-slate-600 hover:border-indigo-400'))
const actionClass = 'inline-grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50'
</script>

<template>
  <li class="glass-card flex gap-3 p-4 transition duration-200 hover:border-indigo-500/40 hover:shadow-[0_0_24px_-6px_rgba(99,102,241,0.45)] motion-safe:hover:scale-[1.01]">
    <button
      :aria-label="done ? 'Marcar como pendiente' : 'Marcar como completada'"
      :aria-pressed="done"
      :class="`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition disabled:opacity-50 ${completionTone}`"
      :disabled="isBusy"
      type="button"
      @click="emit('toggle', task)"
    >
      <Check v-if="done" :size="14" />
    </button>

    <div class="min-w-0 flex-1 space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <h3 :class="`font-semibold ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`">{{ task.title }}</h3>
        <Badge :tone="statusStyles[task.status]">{{ statusLabels[task.status] }}</Badge>
        <Badge :tone="priorityStyles[task.priority]">{{ `Prioridad ${priorityLabels[task.priority].toLowerCase()}` }}</Badge>
        <CollaborativeBadge :users="task.assignedUsers" />
      </div>

      <p v-if="task.description" class="whitespace-pre-line text-sm leading-6 text-slate-400">{{ task.description }}</p>

      <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span
          v-if="task.category"
          class="inline-flex items-center gap-1.5 rounded-full border border-slate-800 px-2.5 py-1"
        >
          <span aria-hidden class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: task.category.color }" />
          {{ task.category.name }}
        </span>
        <span v-if="task.dueDate" :class="`inline-flex items-center gap-1.5 ${overdue ? 'font-semibold text-coral' : ''}`">
          <CalendarDays :size="14" />
          {{ formatDueDate(task.dueDate) }}{{ overdue ? ' · Vencida' : '' }}
        </span>
      </div>
    </div>

    <div class="flex shrink-0 items-start gap-1">
      <button :aria-label="`Editar ${task.title}`" :class="actionClass" :disabled="isBusy" type="button" @click="emit('edit', task)">
        <Pencil :size="16" />
      </button>
      <button :aria-label="`Eliminar ${task.title}`" :class="actionClass" :disabled="isBusy" type="button" @click="emit('delete', task)">
        <Trash2 :size="16" />
      </button>
    </div>
  </li>
</template>
