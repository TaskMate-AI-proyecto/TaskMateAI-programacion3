<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'

defineProps<{ message: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="empty-state rounded-md" role="alert">
    <p class="text-coral">{{ message }}</p>
    <button class="command-button" type="button" @click="$emit('retry')">
      <RefreshCw :size="16" />Reintentar
    </button>
  </div>
</template>
