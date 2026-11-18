<script setup lang="ts">
import { switchCopy } from './otpCopy'
import type { AuthMode } from '../../types/auth'

defineProps<{ mode: AuthMode }>()

defineEmits<{ 'switch-mode': [] }>()
</script>

<template>
  <p class="text-sm text-slate-400">
    {{ switchCopy[mode].question }}
    <button class="text-link" type="button" @click="$emit('switch-mode')">{{ switchCopy[mode].label }}</button>
  </p>
</template>
