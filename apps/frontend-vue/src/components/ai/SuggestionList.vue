<script setup lang="ts">
import { computed } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { patchSuggestion, removeSuggestion, selectedTexts, type Suggestion } from './suggestions'

const props = defineProps<{ suggestions: Suggestion[] }>()

const emit = defineEmits<{
  change: [suggestions: Suggestion[]]
  accept: []
}>()

const selectedCount = computed(() => selectedTexts(props.suggestions).length)

function patch(index: number, changes: Partial<Suggestion>) {
  emit('change', patchSuggestion(props.suggestions, index, changes))
}

// Enter no envía el formulario de la tarea mientras se edita una subtarea.
function blockEnter(event: KeyboardEvent) {
  if (event.key === 'Enter') event.preventDefault()
}
</script>

<template>
  <div class="space-y-3">
    <ul class="space-y-2">
      <li v-for="(item, index) in suggestions" :key="index" class="flex items-center gap-2">
        <input
          :aria-label="`Incluir subtarea ${index + 1}`"
          :checked="item.selected"
          class="h-4 w-4 shrink-0 accent-indigo-500"
          type="checkbox"
          @change="patch(index, { selected: ($event.target as HTMLInputElement).checked })"
        />
        <input
          :aria-label="`Subtarea ${index + 1}`"
          :value="item.text"
          class="min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"
          type="text"
          @input="patch(index, { text: ($event.target as HTMLInputElement).value })"
          @keydown="blockEnter"
        />
        <button
          :aria-label="`Descartar subtarea ${index + 1}`"
          class="inline-grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-800"
          type="button"
          @click="emit('change', removeSuggestion(suggestions, index))"
        >
          <X :size="15" />
        </button>
      </li>
    </ul>
    <div class="flex justify-end gap-2">
      <button class="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800" type="button" @click="emit('change', [])">Descartar</button>
      <button :disabled="selectedCount === 0" class="command-button disabled:opacity-60" type="button" @click="emit('accept')">
        <Plus :size="15" />Agregar {{ selectedCount }} a la tarea
      </button>
    </div>
  </div>
</template>
