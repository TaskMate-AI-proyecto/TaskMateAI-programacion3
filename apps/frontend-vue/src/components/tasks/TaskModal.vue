<script setup lang="ts">
import { ref } from 'vue'
import type { Category, Task, TaskInput } from '../../types/api'
import { toFormValues, toTaskInput, priorityOptions, statusOptions, toCategoryOptions } from '../../utils/taskUtils'
import Modal from '../ui/Modal.vue'
import SelectField from '../ui/SelectField.vue'

interface Props {
  task: Task | null
  categories: Category[]
  isSaving: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [input: TaskInput]
  close: []
}>()

const values = ref(toFormValues(props.task))

function setField<K extends keyof typeof values.value>(key: K) {
  return (value: typeof values.value[K]) => {
    values.value[key] = value
  }
}

function handleSubmit(event: Event) {
  event.preventDefault()
  emit('submit', toTaskInput(values.value))
}

function submitLabel() {
  if (props.isSaving) return 'Guardando...'
  return props.task ? 'Guardar cambios' : 'Crear tarea'
}
</script>

<template>
  <Modal :title="task ? 'Editar tarea' : 'Nueva tarea'" @close="emit('close')">
    <form class="space-y-4" @submit="handleSubmit">
      <label class="block text-sm font-medium text-slate-300">
        Título
        <input
          autofocus
          class="field"
          maxlength="120"
          required
          type="text"
          :value="values.title"
          @input="setField('title')(($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block text-sm font-medium text-slate-300">
        Descripción
        <textarea
          class="field"
          rows="3"
          :value="values.description"
          @input="setField('description')(($event.target as HTMLTextAreaElement).value)"
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <SelectField
          :model-value="values.priority"
          :options="priorityOptions"
          label="Prioridad"
          @update:model-value="setField('priority')"
        />
        <SelectField
          :model-value="values.status"
          :options="statusOptions"
          label="Estado"
          @update:model-value="setField('status')"
        />
        <SelectField
          :model-value="values.categoryId"
          :options="toCategoryOptions(categories, 'Sin categoría')"
          label="Categoría"
          @update:model-value="setField('categoryId')"
        />
        <label class="block text-sm font-medium text-slate-300">
          Fecha de vencimiento
          <input
            class="field"
            type="date"
            :value="values.dueDate"
            @input="setField('dueDate')(($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          class="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          type="button"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          :disabled="isSaving || !values.title.trim()"
          class="command-button disabled:opacity-60"
          type="submit"
        >
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  </Modal>
</template>
