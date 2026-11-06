<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { Task } from '../../types/api'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles } from '../../utils/taskUtils'
import Badge from '../ui/Badge.vue'

interface Props {
  task: Task
  isPending: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: [task: Task]
}>()

const done = () => props.task.status === 'COMPLETED'

function completionLabel(title: string, isDone: boolean) {
  return isDone ? `Marcar ${title} como pendiente` : `Marcar ${title} como completada`
}
</script>

<template>
  <li
    class="glass-card flex flex-wrap items-center gap-3 px-4 py-3 transition duration-200 hover:border-indigo-500/40 hover:shadow-[0_0_24px_-6px_rgba(99,102,241,0.45)] motion-safe:hover:scale-[1.01]"
  >
    <button
      :aria-label="completionLabel(task.title, done())"
      :aria-pressed="done()"
      :class="[
        'grid h-6 w-6 shrink-0 place-items-center rounded-full border transition disabled:opacity-50',
        done() ? 'border-mint bg-mint text-white' : 'border-slate-600 hover:border-indigo-400',
      ]"
      :disabled="isPending"
      type="button"
      @click="emit('toggle', task)"
    >
      <Check v-if="done()" :size="14" />
    </button>

    <span
      :class="[
        'min-w-0 flex-1 truncate font-medium',
        done() ? 'text-slate-500 line-through' : 'text-slate-100',
      ]"
    >
      {{ task.title }}
    </span>

    <span v-if="task.dueDate" :class="['text-xs', isOverdue(task) ? 'font-semibold text-coral' : 'text-slate-400']">
      {{ formatDueDate(task.dueDate) }}
    </span>

    <Badge :tone="priorityStyles[task.priority]">
      {{ priorityLabels[task.priority] }}
    </Badge>
  </li>
</template>
