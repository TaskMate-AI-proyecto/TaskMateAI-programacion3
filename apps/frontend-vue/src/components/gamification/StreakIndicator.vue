<script setup lang="ts">
import { Flame } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useGamificationStore } from '../../stores/gamification'

// Indicador compacto de la cápsula lateral: días de racha y nivel. Lleva a la vista de logros.
const gamification = useGamificationStore()
</script>

<template>
  <RouterLink
    v-if="gamification.profile"
    :aria-label="`Logros: racha de ${gamification.profile.currentStreak} días, nivel ${gamification.profile.level}`"
    class="flex w-full flex-col items-center gap-1.5 rounded-full border border-glass/10 bg-glass/5 px-2 py-2 text-xs text-slate-100 shadow-[0_0_18px_-8px_rgba(239,111,94,0.6)] backdrop-blur-xl transition hover:bg-glass/10"
    title="Logros y progreso"
    to="/achievements"
  >
    <span class="flex items-center gap-1 font-semibold">
      <Flame class="text-coral" :size="16" />
      {{ gamification.profile.currentStreak }}
    </span>
    <span class="whitespace-nowrap rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 px-2.5 py-1 text-[11px] font-bold text-white">
      Nvl {{ gamification.profile.level }}
    </span>
  </RouterLink>
</template>
