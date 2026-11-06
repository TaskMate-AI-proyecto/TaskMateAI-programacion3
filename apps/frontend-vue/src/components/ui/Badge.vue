<script setup lang="ts">
defineProps<{
  tone: string
}>()
</script>

<template>
  <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', tone]">
    <slot />
  </span>
</template>
