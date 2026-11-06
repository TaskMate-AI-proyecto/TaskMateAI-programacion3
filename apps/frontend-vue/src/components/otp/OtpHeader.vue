<script setup lang="ts">
import { computed } from 'vue'
import { authCopy, codeStepCopy, type OtpStep } from './otpCopy'
import type { AuthMode } from '../../types/auth'

const props = defineProps<{ mode: AuthMode; step: OtpStep }>()

const text = computed(() => (props.step === 'code' ? codeStepCopy : authCopy[props.mode].email))
</script>

<template>
  <div>
    <p class="eyebrow">{{ authCopy[mode].eyebrow }}</p>
    <h1 class="font-display text-4xl font-semibold text-slate-100">{{ text.title }}</h1>
    <p class="mt-3 text-slate-400">{{ text.subtitle }}</p>
  </div>
</template>
