<script setup lang="ts">
import { reactive } from 'vue'
import type { Category, CategoryInput } from '../../types/api'

const palette = ['#EF6F5E', '#4B9B84', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280']
const defaultColor = palette[0].toLowerCase()

const props = defineProps<{ editing: Category | null; isSaving: boolean }>()

const emit = defineEmits<{ submit: [input: Required<CategoryInput>]; cancel: [] }>()

// Igual que el formulario React: el color se guarda en minúsculas y el nombre sin espacios sobrantes.
const values = reactive({
  name: props.editing?.name ?? '',
  color: props.editing ? props.editing.color.toLowerCase() : defaultColor,
})

function submitLabel() {
  if (props.isSaving) return 'Guardando...'

  return props.editing ? 'Guardar' : 'Crear categoría'
}

function handleSubmit() {
  emit('submit', { name: values.name.trim(), color: values.color })
}
</script>

<template>
  <form class="space-y-3 border-t border-slate-800 pt-4" @submit.prevent="handleSubmit">
    <h3 class="text-sm font-semibold">{{ editing ? 'Editar categoría' : 'Nueva categoría' }}</h3>
    <label class="block text-sm font-medium">
      Nombre
      <input v-model="values.name" class="field" maxlength="40" required type="text" />
    </label>
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="swatch in palette"
        :key="swatch"
        :aria-label="`Color ${swatch}`"
        :aria-pressed="values.color === swatch.toLowerCase()"
        :class="['h-7 w-7 rounded-full border-2', values.color === swatch.toLowerCase() ? 'border-slate-100' : 'border-transparent']"
        :style="{ backgroundColor: swatch }"
        type="button"
        @click="values.color = swatch.toLowerCase()"
      />
      <input
        v-model="values.color"
        aria-label="Color personalizado"
        class="h-7 w-10 cursor-pointer rounded border border-slate-700 bg-slate-950"
        type="color"
      />
    </div>
    <div class="flex justify-end gap-2">
      <button
        v-if="editing"
        class="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        type="button"
        @click="emit('cancel')"
      >
        Cancelar edición
      </button>
      <button :disabled="isSaving || !values.name.trim()" class="command-button disabled:opacity-60" type="submit">
        {{ submitLabel() }}
      </button>
    </div>
  </form>
</template>
