<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div aria-busy="true" aria-live="polite" class="space-y-2.5">
    <p class="text-sm text-slate-400">{{ message }}</p>
    <div class="animate-pulse space-y-2">
      <div class="h-8 rounded bg-slate-800/70" />
      <div class="h-8 rounded bg-slate-800/70" />
      <div class="h-8 w-3/4 rounded bg-slate-800/70" />
    </div>
  </div>
</template>
