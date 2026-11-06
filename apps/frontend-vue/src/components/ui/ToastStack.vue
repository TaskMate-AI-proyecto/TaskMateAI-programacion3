<script setup lang="ts">
import { CheckCircle2, XCircle } from 'lucide-vue-next'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
</script>

<template>
  <div aria-live="polite" class="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
    <div
      v-for="item in toast.toasts"
      :key="item.id"
      :class="[
        'pointer-events-auto flex items-start gap-2 rounded-md border bg-slate-900/90 p-3 text-sm shadow-[0_0_24px_-6px_rgba(99,102,241,0.45)] backdrop-blur-md',
        item.kind === 'error' ? 'border-coral/40 text-coral' : 'border-emerald-500/40 text-emerald-300',
      ]"
      role="status"
    >
      <XCircle v-if="item.kind === 'error'" class="mt-0.5 shrink-0" :size="16" />
      <CheckCircle2 v-else class="mt-0.5 shrink-0" :size="16" />
      <span class="text-slate-100">{{ item.message }}</span>
    </div>
  </div>
</template>
