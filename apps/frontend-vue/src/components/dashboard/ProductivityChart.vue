<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../../types/api'
import { barRatio, buildPriorityBars, completionPercent, type PriorityBar } from './productivity'

const props = defineProps<{ tasks: Task[]; isLoading: boolean }>()

const bars = computed(() => buildPriorityBars(props.tasks))
const percent = computed(() => completionPercent(bars.value))
const description = computed(() =>
  bars.value.map((bar) => `${bar.label}: ${bar.completed} de ${bar.total} completadas`).join('. '),
)

// El crecimiento de la barra es altura: la transición CSS se anula con prefers-reduced-motion.
function columnHeight(bar: PriorityBar) {
  return `${Math.max(barRatio(bar, bars.value) * 100, bar.total ? 6 : 2)}%`
}

function completedHeight(bar: PriorityBar) {
  return `${bar.total === 0 ? 0 : (bar.completed / bar.total) * 100}%`
}
</script>

<template>
  <section aria-labelledby="productivity-title" class="glass-card p-5">
    <div class="flex items-center justify-between gap-3">
      <h2 id="productivity-title" class="font-display text-2xl font-semibold text-slate-100">Productividad</h2>
      <span class="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{{ percent }}% completadas</span>
    </div>

    <div v-if="isLoading" aria-busy="true" class="mt-6 h-44 animate-pulse rounded-2xl bg-slate-800/50" />

    <div v-else :aria-label="description" class="mt-6 flex gap-3" role="img">
      <div v-for="bar in bars" :key="bar.priority" class="flex flex-1 flex-col items-center gap-2">
        <div class="flex h-40 w-full items-end justify-center">
          <div
            class="flex w-full max-w-[56px] flex-col justify-end overflow-hidden rounded-2xl border border-glass/10 bg-glass/5 transition-[height] duration-500 ease-out"
            :style="{ height: columnHeight(bar) }"
          >
            <div class="w-full bg-gradient-to-t from-indigo-600 to-violet-500" :style="{ height: completedHeight(bar) }" />
          </div>
        </div>
        <p class="text-xs font-medium text-slate-300">{{ bar.label }}</p>
        <p class="text-[11px] text-slate-500">{{ bar.completed }}/{{ bar.total }}</p>
      </div>
    </div>
  </section>
</template>
