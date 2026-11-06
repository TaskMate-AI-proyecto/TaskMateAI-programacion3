<script setup lang="ts">
import type { Task } from '../../types/api'
import type { PriorityFilter } from '../../composables/useTasksData'
import { filterTasks, priorityLabels } from '../../utils/taskUtils'
import TaskListItem from './TaskListItem.vue'

interface Props {
  tasks: Task[]
  isLoading: boolean
  priority: PriorityFilter
  pendingId: string | null
}

interface Emits {
  toggle: [task: Task]
  'priority-change': [priority: PriorityFilter]
}

defineProps<Props>()
defineEmits<Emits>()

const priorityChips: { value: PriorityFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
]

const chipClass = 'rounded-full border px-3 py-1 text-xs font-semibold transition'
const chipActive = 'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_14px_-4px_rgba(139,92,246,0.7)]'
const chipIdle = 'border-slate-800 bg-slate-900/60 text-slate-300 backdrop-blur-md hover:border-indigo-500/60'

function emptyMessage(tasks: Task[], priority: PriorityFilter) {
  if (tasks.length === 0) return 'Aún no tienes tareas.'
  if (priority === 'ALL') return 'No hay tareas que mostrar.'
  return `No hay tareas de prioridad ${priorityLabels[priority as keyof typeof priorityLabels].toLowerCase()}.`
}
</script>

<template>
  <section>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-display text-2xl font-semibold text-slate-100">Tareas</h2>
      <div aria-label="Filtrar por prioridad" class="flex flex-wrap gap-2" role="group">
        <button
          v-for="chip in priorityChips"
          :key="chip.value"
          :aria-pressed="priority === chip.value"
          :class="[chipClass, priority === chip.value ? chipActive : chipIdle]"
          type="button"
          @click="$emit('priority-change', chip.value)"
        >
          {{ chip.label }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" aria-busy="true" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-md bg-slate-800/70" />
    </div>

    <div v-else>
      <ul v-if="filterTasks(tasks, { search: '', status: 'ALL', priority, categoryId: '' }).length > 0" aria-label="Lista de tareas" class="space-y-2">
        <TaskListItem
          v-for="task in filterTasks(tasks, { search: '', status: 'ALL', priority, categoryId: '' })"
          :key="task.id"
          :is-pending="pendingId === task.id"
          :task="task"
          @toggle="$emit('toggle', $event)"
        />
      </ul>
      <p v-else class="empty-state rounded-md">
        {{ emptyMessage(tasks, priority) }}
      </p>
    </div>
  </section>
</template>
