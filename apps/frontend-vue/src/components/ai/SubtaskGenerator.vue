<script setup lang="ts">
import { computed, ref } from 'vue'
import { RefreshCw, Sparkles } from 'lucide-vue-next'
import { generateSubtasks } from '../../api/aiApi'
import { getAiErrorMessage } from '../../api/errors'
import { useProgressStep } from '../../composables/useProgressStep'
import { useToastStore } from '../../stores/toast'
import GenerationProgress from './GenerationProgress.vue'
import SuggestionList from './SuggestionList.vue'
import { selectedTexts, toSuggestions, type Suggestion } from './suggestions'

const props = defineProps<{ taskId: string }>()

const emit = defineEmits<{ accept: [subtasks: string[]] }>()

const toast = useToastStore()
const suggestions = ref<Suggestion[]>([])
const isLoading = ref(false)
const progressMessages = ['Analizando la tarea...', 'Pensando los pasos...', 'Ordenando las subtareas...', 'Casi listo...']
const { step, reset } = useProgressStep(isLoading, progressMessages.length - 1)

const hasSuggestions = computed(() => suggestions.value.length > 0)
const buttonLabel = computed(() => {
  if (isLoading.value) return 'Generando...'

  return hasSuggestions.value ? 'Regenerar' : 'Desglosar con IA'
})

async function generate() {
  if (isLoading.value) return
  reset()
  isLoading.value = true

  try {
    suggestions.value = toSuggestions(await generateSubtasks(props.taskId))
  } catch (error) {
    toast.notify(getAiErrorMessage(error), 'error')
  } finally {
    isLoading.value = false
  }
}

function accept() {
  const accepted = selectedTexts(suggestions.value)
  if (accepted.length === 0) return

  emit('accept', accepted)
  suggestions.value = []
  toast.notify('Subtareas añadidas a la descripción. Guarda la tarea para conservarlas.')
}
</script>

<template>
  <div class="space-y-3 rounded-md border border-slate-800 bg-slate-950/40 p-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-medium">Asistente de IA</p>
      <button
        :disabled="isLoading"
        class="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-indigo-500/60 disabled:cursor-wait disabled:opacity-60"
        type="button"
        @click="generate"
      >
        <component
          :is="hasSuggestions ? RefreshCw : Sparkles"
          :class="isLoading ? (hasSuggestions ? 'animate-spin' : 'animate-pulse') : ''"
          :size="15"
        />
        {{ buttonLabel }}
      </button>
    </div>
    <GenerationProgress v-if="isLoading" :message="progressMessages[step]" />
    <SuggestionList
      v-else-if="hasSuggestions"
      :suggestions="suggestions"
      @accept="accept"
      @change="suggestions = $event"
    />
  </div>
</template>
