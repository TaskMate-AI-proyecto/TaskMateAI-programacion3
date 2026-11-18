<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Flame, Lock, Trophy } from 'lucide-vue-next'
import { getApiErrorMessage } from '../api/errors'
import { getGamificationProfile } from '../api/gamificationApi'
import ErrorPanel from '../components/ui/ErrorPanel.vue'
import type { AchievementStatus, GamificationProfile } from '../types/api'
import { levelProgressPercent } from '../utils/gamification'

const profile = ref<GamificationProfile | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)

const percent = computed(() => (profile.value ? levelProgressPercent(profile.value) : 0))

function formatUnlockedAt(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function load() {
  isLoading.value = true

  try {
    profile.value = await getGamificationProfile()
    error.value = null
  } catch (err) {
    error.value = getApiErrorMessage(err, 'No se pudieron cargar tus logros.')
  } finally {
    isLoading.value = false
  }
}

function achievementClass(item: AchievementStatus) {
  return item.unlocked
    ? 'rounded-2xl border border-indigo-400/60 bg-indigo-500/10 p-4 shadow-[0_0_24px_-6px_rgba(99,102,241,0.7)]'
    : 'rounded-2xl border border-glass/10 bg-glass/5 p-4 opacity-50'
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="eyebrow">Progreso</p>
      <h1 class="font-display text-4xl font-semibold text-slate-100">Logros y progreso</h1>
      <p class="mt-2 max-w-lg text-slate-400">Completa tareas para ganar XP, mantener tu racha y desbloquear insignias.</p>
    </div>

    <ErrorPanel v-if="!profile && error" :message="error" @retry="load" />
    <div v-else-if="!profile && isLoading" aria-busy="true" class="glass-card h-56 animate-pulse" />

    <template v-if="profile">
      <section aria-labelledby="level-title" class="rounded-3xl border border-glass/10 bg-glass/5 p-6 backdrop-blur-xl">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="eyebrow">Nivel actual</p>
            <h2 id="level-title" class="font-display text-5xl font-semibold text-slate-100">Nivel {{ profile.level }}</h2>
            <p class="mt-2 text-sm text-slate-400">
              {{ profile.xp }} XP · faltan {{ profile.nextLevelXp - profile.xp }} XP para el nivel {{ profile.level + 1 }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-glass/10 bg-glass/5 px-4 py-3">
              <p class="flex items-center gap-1.5 text-xs text-slate-400"><Flame class="text-coral" :size="14" />Racha actual</p>
              <p class="font-display text-3xl font-semibold text-slate-100">
                {{ profile.currentStreak }} <span class="text-sm font-normal text-slate-400">{{ profile.currentStreak === 1 ? 'día' : 'días' }}</span>
              </p>
            </div>
            <div class="rounded-2xl border border-glass/10 bg-glass/5 px-4 py-3">
              <p class="flex items-center gap-1.5 text-xs text-slate-400"><Flame class="text-coral" :size="14" />Racha máxima</p>
              <p class="font-display text-3xl font-semibold text-slate-100">
                {{ profile.longestStreak }} <span class="text-sm font-normal text-slate-400">{{ profile.longestStreak === 1 ? 'día' : 'días' }}</span>
              </p>
            </div>
          </div>
        </div>
        <div
          aria-label="Progreso hacia el siguiente nivel"
          aria-valuemax="100"
          aria-valuemin="0"
          :aria-valuenow="Math.round(percent)"
          class="mt-6 h-3 overflow-hidden rounded-full bg-glass/10"
          role="progressbar"
        >
          <div
            class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-[width] duration-700 ease-out"
            :style="{ width: `${percent}%` }"
          />
        </div>
      </section>

      <ul aria-label="Insignias" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="item in profile.achievements" :key="item.key" :class="achievementClass(item)">
          <template v-if="item.unlocked">
            <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
              <Trophy :size="18" />
              <h3 class="font-semibold text-slate-100">{{ item.title }}</h3>
            </div>
            <p class="mt-2 text-sm text-slate-300">{{ item.description }}</p>
            <p v-if="item.unlockedAt" class="mt-3 text-xs text-slate-400">Obtenido el {{ formatUnlockedAt(item.unlockedAt) }}</p>
          </template>
          <template v-else>
            <div class="flex items-center gap-2 text-slate-400">
              <Lock :size="18" />
              <h3 class="font-semibold text-slate-200">{{ item.title }}</h3>
            </div>
            <p class="mt-2 text-sm text-slate-400">Requisito: {{ item.description }}</p>
          </template>
        </li>
      </ul>
    </template>
  </div>
</template>
