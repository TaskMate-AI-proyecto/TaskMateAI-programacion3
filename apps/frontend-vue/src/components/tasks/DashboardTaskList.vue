<script setup lang="ts">
import { computed } from 'vue'
import type { ViewMode } from '../../composables/useViewMode'
import type { PriorityFilter } from '../../composables/useTasksData'
import type { Task, TaskStatus } from '../../types/api'
import { filterTasks, priorityLabels } from '../../utils/taskUtils'
import KanbanBoard from '../kanban/KanbanBoard.vue'
import ViewModeToggle from '../dashboard/ViewModeToggle.vue'
import TaskListItem from './TaskListItem.vue'

interface Props {
  tasks: Task[]
  isLoading: boolean
  priority: PriorityFilter
  pendingId: string | null
  view?: ViewMode
}

interface Emits {
  toggle: [task: Task]
  'priority-change': [priority: PriorityFilter]
  'view-change': [view: ViewMode]
  move: [task: Task, status: TaskStatus]
}

const props = withDefaults(defineProps<Props>(), { view: 'list' })
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

const visibleTasks = computed(() => filterTasks(props.tasks, { search: '', status: 'ALL', priority: props.priority, categoryId: '' }))

// Mensaje del estado vacío: distingue "no hay tareas" de "ninguna coincide con la prioridad".
const emptyMessage = computed(() => {
  if (props.tasks.length === 0) return 'Aún no tienes tareas.'
  if (props.priority === 'ALL') return 'No hay tareas que mostrar.'

  return `No hay tareas de prioridad ${priorityLabels[props.priority].toLowerCase()}.`
})

// El tablero necesita todo el ancho del Dashboard; la lista conserva la columna principal.
const sectionClass = computed(() => (props.view === 'kanban' ? 'min-w-0 xl:col-span-3' : 'min-w-0 xl:col-span-2'))
</script>

<template>
  <section :class="sectionClass">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="font-display text-2xl font-semibold text-slate-100">Tareas</h2>
        <ViewModeToggle :model-value="view" @update:model-value="$emit('view-change', $event)" />
      </div>
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

    <KanbanBoard
      v-if="view === 'kanban'"
      :is-loading="isLoading"
      :pending-id="pendingId"
      :tasks="visibleTasks"
      @move="(task, status) => $emit('move', task, status)"
    />

    <template v-else>
      <div v-if="isLoading" aria-busy="true" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-md bg-slate-800/70" />
      </div>

      <ul v-else-if="visibleTasks.length > 0" aria-label="Lista de tareas" class="space-y-2">
        <TaskListItem
          v-for="task in visibleTasks"
          :key="task.id"
          :is-pending="pendingId === task.id"
          :task="task"
          @toggle="$emit('toggle', $event)"
        />
      </ul>

      <p v-else class="empty-state rounded-md">
        {{ emptyMessage }}
      </p>
    </template>
  </section>
</template>
