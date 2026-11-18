<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RefreshCw, Sparkles } from 'lucide-vue-next'
import { getDailySummary } from '../../api/aiApi'
import { getAiErrorMessage } from '../../api/errors'
import { useToastStore } from '../../stores/toast'
import AiText from '../chat/AiText.vue'

const toast = useToastStore()
const summary = ref<string | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)

async function load() {
  isLoading.value = true
  error.value = null

  try {
    summary.value = await getDailySummary()
  } catch (requestError) {
    error.value = getAiErrorMessage(requestError)
    toast.notify(error.value, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section :aria-busy="isLoading" class="glass-card p-5">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Sparkles aria-hidden class="text-coral" :size="20" />
        <h2 class="font-display text-2xl font-semibold">Resumen del día</h2>
      </div>
      <button
        aria-label="Actualizar resumen"
        class="icon-button"
        :disabled="isLoading"
        title="Actualizar resumen"
        type="button"
        @click="load"
      >
        <RefreshCw :class="isLoading ? 'animate-spin' : ''" :size="18" />
      </button>
    </div>

    <div class="mt-4">
      <div v-if="isLoading" class="animate-pulse space-y-2.5">
        <div class="h-3.5 w-full rounded bg-slate-800/70" />
        <div class="h-3.5 w-11/12 rounded bg-slate-800/70" />
        <div class="h-3.5 w-4/5 rounded bg-slate-800/70" />
        <p class="pt-1 text-xs text-slate-500">Consultando al asistente...</p>
      </div>

      <p v-else-if="error" class="text-sm text-coral" role="alert">{{ error }}</p>

      <AiText v-else class="text-sm leading-6 text-slate-300" :text="summary ?? ''" />
    </div>
  </section>
</template>
