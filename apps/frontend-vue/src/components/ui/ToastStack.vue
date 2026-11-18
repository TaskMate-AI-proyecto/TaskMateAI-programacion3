<script setup lang="ts">
import { CheckCircle2, Trophy, XCircle, Zap } from 'lucide-vue-next'
import type { Component } from 'vue'
import { useToastStore, type ToastKind } from '../../stores/toast'

const toast = useToastStore()

// Estilo y icono por tipo. Los avisos de gamificación usan acentos índigo y ámbar sobre el mismo vidrio.
const toneClasses: Record<ToastKind, string> = {
  success: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  error: 'border-coral/40 text-coral',
  reward: 'border-indigo-400/40 text-indigo-600 dark:text-indigo-300',
  achievement: 'border-amber-400/50 text-amber-700 dark:text-amber-300',
}

const icons: Record<ToastKind, Component> = {
  success: CheckCircle2,
  error: XCircle,
  reward: Zap,
  achievement: Trophy,
}
</script>

<template>
  <div aria-live="polite" class="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
    <div
      v-for="item in toast.toasts"
      :key="item.id"
      :class="[
        'pointer-events-auto flex items-start gap-2 rounded-md border bg-slate-900/90 p-3 text-sm shadow-[0_0_24px_-6px_rgba(99,102,241,0.45)] backdrop-blur-md',
        toneClasses[item.kind],
      ]"
      role="status"
    >
      <component :is="icons[item.kind]" class="mt-0.5 shrink-0" :size="16" />
      <span class="text-slate-100">{{ item.message }}</span>
    </div>
  </div>
</template>
