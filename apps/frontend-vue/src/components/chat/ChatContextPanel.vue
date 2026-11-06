<script setup lang="ts">
import { computed } from 'vue'
import { Bot, Clock, ListTodo } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { Task } from '../../types/api'
import { isOverdue, priorityLabels, priorityStyles } from '../../utils/taskUtils'
import Badge from '../ui/Badge.vue'

const analyzedLimit = 5

const props = defineProps<{
  email?: string
  pending: Task[]
}>()

const metrics = computed(() => [
  { label: 'Pendientes', value: props.pending.length },
  { label: 'Alta prioridad', value: props.pending.filter((task) => task.priority === 'HIGH').length },
  { label: 'Vencidas', value: props.pending.filter(isOverdue).length },
])

const analyzed = computed(() => props.pending.slice(0, analyzedLimit))
</script>

<template>
  <aside aria-label="Contexto de TaskMate AI" class="glass-card flex min-h-[32rem] flex-col gap-5 p-5">
    <div class="flex items-center gap-3">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600">
        <Bot :size="22" />
      </span>
      <div>
        <p class="font-semibold text-slate-100">TaskMate AI</p>
        <p class="text-xs text-slate-400">Asistente de gestión de tareas</p>
      </div>
    </div>

    <div aria-label="Métricas del contexto" class="grid grid-cols-3 gap-2" role="group">
      <div v-for="metric in metrics" :key="metric.label" class="rounded-2xl border border-white/10 bg-white/5 p-3">
        <p class="font-display text-2xl font-semibold text-slate-100">{{ metric.value }}</p>
        <p class="text-xs text-slate-400">{{ metric.label }}</p>
      </div>
    </div>

    <section aria-labelledby="analyzed-title" class="space-y-2">
      <h2 id="analyzed-title" class="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <ListTodo :size="16" />
        Tareas analizadas
      </h2>
      <p v-if="analyzed.length === 0" class="text-sm text-slate-500">No hay tareas pendientes para analizar.</p>
      <ul v-else class="space-y-2">
        <li v-for="task in analyzed" :key="task.id">
          <RouterLink
            class="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
            to="/dashboard"
          >
            <span class="min-w-0 truncate text-sm text-slate-100">{{ task.title }}</span>
            <Badge :tone="priorityStyles[task.priority]">{{ priorityLabels[task.priority] }}</Badge>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section aria-labelledby="context-title" class="mt-auto space-y-2 text-sm text-slate-400">
      <h2 id="context-title" class="flex items-center gap-2 font-semibold text-slate-200">
        <Clock :size="16" />
        Contexto activo
      </h2>
      <p>Workspace de {{ email ?? 'tu espacio personal' }}.</p>
    </section>
  </aside>
</template>
