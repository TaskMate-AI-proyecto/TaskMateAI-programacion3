<script setup lang="ts">
import { computed } from 'vue'
import { Mail, ShieldCheck } from 'lucide-vue-next'
import { authCopy, codeStepCopy, type OtpStep } from './otpCopy'
import type { AuthMode } from '../../types/auth'

// Sólo el panel activo lleva h1: el oculto usa h2 para que la página tenga un único título principal.
const props = withDefaults(defineProps<{ mode: AuthMode; step: OtpStep; isActive?: boolean }>(), { isActive: true })

const text = computed(() => (props.step === 'code' ? codeStepCopy : authCopy[props.mode].email))
const icon = computed(() => (props.step === 'code' ? ShieldCheck : Mail))
const headingTag = computed(() => (props.isActive ? 'h1' : 'h2'))
</script>

<template>
  <div>
    <span class="relative mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
      <span aria-hidden class="absolute inset-0 rounded-2xl bg-indigo-500/30 animate-pulse-ring motion-reduce:hidden" />
      <component :is="icon" class="relative" :size="22" />
    </span>
    <p class="eyebrow">{{ authCopy[mode].eyebrow }}</p>
    <component :is="headingTag" class="font-display text-4xl font-semibold text-slate-100">{{ text.title }}</component>
    <p class="mt-3 text-slate-400">{{ text.subtitle }}</p>
  </div>
</template>
