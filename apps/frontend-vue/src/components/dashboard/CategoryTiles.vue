<script setup lang="ts">
import { Tags } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { Category, Task } from '../../types/api'

const props = defineProps<{ categories: Category[]; tasks: Task[] }>()

// Tareas de la categoría que todavía no están completadas.
function pendingIn(category: Category) {
  return props.tasks.filter((task) => task.categoryId === category.id && task.status !== 'COMPLETED').length
}
</script>

<template>
  <section aria-labelledby="category-tiles-title" class="space-y-3">
    <h2 id="category-tiles-title" class="font-display text-2xl font-semibold text-slate-100">Categorías</h2>

    <p v-if="categories.length === 0" class="glass-card p-4 text-sm text-slate-400">
      Aún no tienes categorías. Créalas desde Tareas.
    </p>

    <ul v-else class="grid grid-cols-2 gap-3">
      <li
        v-for="category in categories"
        :key="category.id"
        class="transition duration-300 ease-out motion-safe:hover:-translate-y-1"
      >
        <RouterLink
          class="flex h-full flex-col justify-between gap-6 rounded-2xl border border-glass/15 p-4 text-white shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]"
          :style="{ background: `linear-gradient(135deg, ${category.color}, #1e1b4b)` }"
          to="/tasks"
        >
          <Tags aria-hidden :size="20" />
          <div>
            <p class="font-semibold">{{ category.name }}</p>
            <p class="text-xs text-white/80">{{ pendingIn(category) }} pendientes</p>
          </div>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
