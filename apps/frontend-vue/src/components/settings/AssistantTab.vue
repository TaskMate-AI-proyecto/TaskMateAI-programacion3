<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useToastStore } from '../../stores/toast'
import { clearChatHistory, maxInstructionsLength, personalityOptions } from '../../settings/settings'
import { cn } from '../../utils/cn'
import { eventValue } from '../../utils/events'
import ConfirmDialog from './ConfirmDialog.vue'

// Asistente: personalidad y instrucciones que se envían a Groq, y borrado del historial del chat.
const settingsStore = useSettingsStore()
const toast = useToastStore()
const confirming = ref(false)

function clearHistory() {
  clearChatHistory()
  confirming.value = false
  toast.notify('Historial del chat borrado')
}
</script>

<template>
  <section class="space-y-8">
    <div class="space-y-3">
      <h2 class="text-sm font-semibold text-slate-200">Personalidad</h2>
      <div aria-label="Personalidad del asistente" class="grid gap-3 sm:grid-cols-2" role="radiogroup">
        <button
          v-for="option in personalityOptions"
          :key="option.value"
          :aria-checked="settingsStore.settings.personality === option.value"
          :class="cn('rounded-2xl border p-4 text-left transition', settingsStore.settings.personality === option.value ? 'border-glass/40 bg-glass/10' : 'border-glass/10 bg-glass/5 hover:bg-glass/10')"
          role="radio"
          type="button"
          @click="settingsStore.update({ personality: option.value })"
        >
          <span class="block font-semibold text-slate-100">{{ option.label }}</span>
          <span class="text-xs text-slate-400">{{ option.hint }}</span>
        </button>
      </div>
    </div>

    <div class="flex flex-col">
      <label class="settings-label" for="settings-instructions">Instrucciones personalizadas</label>
      <textarea
        id="settings-instructions"
        class="settings-field settings-textarea"
        :maxlength="maxInstructionsLength"
        placeholder="Ej.: responde siempre en tercera persona y termina con una pregunta"
        rows="4"
        :value="settingsStore.settings.customInstructions"
        @input="settingsStore.update({ customInstructions: eventValue($event) })"
      />
      <p class="settings-hint">{{ settingsStore.settings.customInstructions.length }}/{{ maxInstructionsLength }} · Se añaden al prompt del sistema de cada conversación.</p>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-glass/10 bg-glass/5 p-5">
      <div>
        <p class="font-semibold text-slate-100">Historial del chat</p>
        <p class="text-xs text-slate-400">Borra todas las conversaciones guardadas en este navegador.</p>
      </div>
      <button class="rounded-md border border-glass/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-glass/10" type="button" @click="confirming = true">
        Limpiar historial
      </button>
    </div>

    <ConfirmDialog
      v-if="confirming"
      confirm-label="Limpiar"
      message="Se borrarán todas las conversaciones guardadas en este navegador. Esta acción no se puede deshacer."
      title="¿Limpiar el historial del chat?"
      @cancel="confirming = false"
      @confirm="clearHistory"
    />
  </section>
</template>
