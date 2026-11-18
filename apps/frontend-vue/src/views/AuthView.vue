<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Atmosphere from '../components/layout/Atmosphere.vue'
import ThemeToggle from '../components/layout/ThemeToggle.vue'
import OtpAuthForm from '../components/OtpAuthForm.vue'
import type { AuthMode } from '../types/auth'

interface BladeRun {
  id: number
  direction: 'right' | 'left'
}

// Login y registro en la misma tarjeta: una hoja diagonal cruza el centro y cambia el panel visible detrás de ella.
const props = defineProps<{ initialSignup: boolean }>()

const isSignup = ref(props.initialSignup)
const run = ref<BladeRun | null>(null)

const activeMode = computed<AuthMode>(() => (isSignup.value ? 'register' : 'login'))
// El panel activo va primero en el DOM: es el que reciben el foco y los selectores de la página.
const panelOrder = computed<AuthMode[]>(() => (isSignup.value ? ['register', 'login'] : ['login', 'register']))
const bladeClass = computed(() => (run.value?.direction === 'right' ? 'animate-blade-right' : 'animate-blade-left'))

function toggleMode() {
  run.value = { id: (run.value?.id ?? 0) + 1, direction: isSignup.value ? 'left' : 'right' }
  isSignup.value = !isSignup.value
}

function clearBlade() {
  run.value = null
}
</script>

<template>
  <main class="auth-page">
    <Atmosphere />
    <div class="relative z-10 flex w-full max-w-4xl flex-col gap-6">
      <div class="flex w-full items-center justify-between">
        <RouterLink class="font-display text-xl font-semibold tracking-wide text-slate-100" to="/dashboard">TaskMate</RouterLink>
        <ThemeToggle />
      </div>
      <div class="glass-card animate-fade-up relative grid min-h-[550px] w-full overflow-hidden rounded-3xl p-8 shadow-[0_0_48px_-16px_rgba(99,102,241,0.45)] md:min-h-[600px] md:p-12">
        <OtpAuthForm
          v-for="mode in panelOrder"
          :key="mode"
          :is-active="mode === activeMode"
          :mode="mode"
          @switch-mode="toggleMode"
        />
        <div
          v-if="run"
          :key="run.id"
          :class="[
            'pointer-events-none absolute inset-y-[-10%] left-0 z-10 hidden w-[70%] border border-white/20 bg-white/20 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.08] sm:block',
            bladeClass,
          ]"
          aria-hidden="true"
          @animationend="clearBlade"
        />
      </div>
    </div>
  </main>
</template>
