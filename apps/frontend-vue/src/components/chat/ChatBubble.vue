<script setup lang="ts">
import type { ChatMessage } from '../../utils/chatUtils'

defineProps<{
  message: ChatMessage
}>()
</script>

<template>
  <li :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'glass-card max-w-[80%] px-4 py-3 text-sm leading-6 shadow-none',
        message.role === 'user' ? 'border-indigo-400/30 bg-indigo-500/25 text-indigo-50' : 'bg-slate-800/50 text-slate-200',
      ]"
    >
      {{ message.text }}
    </div>
  </li>
</template>
