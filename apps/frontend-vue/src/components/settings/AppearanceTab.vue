<script setup lang="ts">
import { useSettingsStore } from '../../stores/settings'
import { useTheme } from '../../composables/useTheme'
import { accentOptions } from '../../settings/settings'
import { cn } from '../../utils/cn'

const themeOptions = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
] as const

// Apariencia: acento global (variables CSS) y tema claro/oscuro con la transición de tinta desde el botón pulsado.
const settingsStore = useSettingsStore()
const { theme, select } = useTheme()
</script>

<template>
  <section class="space-y-8">
    <div class="space-y-3">
      <h2 class="text-sm font-semibold text-slate-200">Color de acento</h2>
      <div aria-label="Color de acento" class="flex flex-wrap gap-3" role="group">
        <button
          v-for="option in accentOptions"
          :key="option.value"
          :aria-label="option.label"
          :aria-pressed="settingsStore.settings.accent === option.value"
          :class="cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition', settingsStore.settings.accent === option.value ? 'border-glass/40 bg-glass/10 text-slate-100' : 'border-glass/10 text-slate-400 hover:bg-glass/5')"
          type="button"
          @click="settingsStore.update({ accent: option.value })"
        >
          <span aria-hidden class="h-4 w-4 rounded-full" :style="{ backgroundColor: option.swatch }" />
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <h2 class="text-sm font-semibold text-slate-200">Tema</h2>
      <div aria-label="Tema" class="inline-flex rounded-full border border-glass/10 bg-glass/5 p-1" role="group">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          :aria-pressed="theme === option.value"
          :class="cn('rounded-full px-4 py-1.5 text-sm font-medium transition', theme === option.value ? 'nav-link-active' : 'text-slate-400 hover:text-slate-100')"
          type="button"
          @click="select(option.value, $event)"
        >
          {{ option.label }}
        </button>
      </div>
      <p class="text-xs text-slate-500">El cambio se anima con una transición de tinta desde el botón que pulsas.</p>
    </div>
  </section>
</template>
