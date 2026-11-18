<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../../types/api'
import { buildMetrics } from './dashboardStats'

const props = defineProps<{ tasks: Task[]; isLoading: boolean }>()

const metrics = computed(() => buildMetrics(props.tasks))
</script>

<template>
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
    <article
      v-for="metric in metrics"
      :key="metric.label"
      class="glass-card p-4 transition duration-200 hover:border-indigo-500/40 motion-safe:hover:scale-[1.01]"
    >
      <component :is="metric.icon" aria-hidden class="text-indigo-500 dark:text-indigo-400" :size="18" />
      <div v-if="isLoading" class="mt-3 h-8 w-10 animate-pulse rounded bg-slate-800/70" />
      <p v-else class="mt-3 font-display text-3xl font-semibold text-slate-100">{{ metric.value }}</p>
      <p class="text-xs text-slate-400">{{ metric.label }}</p>
    </article>
  </div>
</template>
