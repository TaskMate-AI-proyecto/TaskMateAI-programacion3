<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { switchCopy } from './otpCopy'
import type { AuthMode } from '../../types/auth'

defineProps<{ mode: AuthMode }>()
</script>

<template>
  <p class="text-sm text-slate-400">
    {{ switchCopy[mode].question }}
    <RouterLink class="text-link" :to="switchCopy[mode].to">{{ switchCopy[mode].label }}</RouterLink>
  </p>
</template>
