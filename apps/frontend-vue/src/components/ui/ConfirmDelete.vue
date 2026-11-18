<script setup lang="ts">
defineProps<{ isBusy: boolean }>()

defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div class="flex items-center gap-1 text-xs">
    <span class="text-slate-400">¿Eliminar?</span>
    <button class="rounded-md bg-coral px-2 py-1 font-semibold text-white disabled:opacity-50" :disabled="isBusy" type="button" @click="$emit('confirm')">Sí</button>
    <button class="rounded-md px-2 py-1 font-semibold text-slate-300 hover:bg-slate-800" type="button" @click="$emit('cancel')">No</button>
  </div>
</template>
