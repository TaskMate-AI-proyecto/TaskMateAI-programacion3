<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { Task } from '../../types/api'
import { formatDueDate, isOverdue, priorityLabels, priorityStyles } from '../../utils/taskUtils'
import Badge from '../ui/Badge.vue'
import { pickUpcoming } from './dashboardStats'

const props = defineProps<{ tasks: Task[]; isLoading: boolean }>()

const upcoming = computed(() => pickUpcoming(props.tasks))
</script>

<template>
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h2 class="font-display text-2xl font-semibold text-slate-100">Próximas pendientes</h2>
      <RouterLink class="text-link text-sm" to="/tasks">Ver todas</RouterLink>
    </div>

    <div v-if="isLoading" aria-busy="true" class="space-y-2">
      <div v-for="item in 3" :key="item" class="h-14 animate-pulse rounded-md bg-slate-800/70" />
    </div>

    <div v-else-if="upcoming.length === 0" class="empty-state rounded-md">
      <CheckCircle2 aria-hidden :size="28" />
      <p>{{ tasks.length === 0 ? 'Aún no tienes tareas.' : 'No tienes tareas pendientes. ¡Buen trabajo!' }}</p>
      <RouterLink class="text-link text-sm" to="/tasks">Ir a tareas</RouterLink>
    </div>

    <ul v-else class="space-y-2">
      <li v-for="task in upcoming" :key="task.id" class="glass-card flex flex-wrap items-center gap-3 px-4 py-3">
        <span class="min-w-0 flex-1 truncate font-medium">{{ task.title }}</span>
        <span v-if="task.dueDate" :class="['text-xs', isOverdue(task) ? 'font-semibold text-coral' : 'text-slate-400']">
          {{ formatDueDate(task.dueDate) }}
        </span>
        <Badge :tone="priorityStyles[task.priority]">{{ priorityLabels[task.priority] }}</Badge>
      </li>
    </ul>
  </section>
</template>
