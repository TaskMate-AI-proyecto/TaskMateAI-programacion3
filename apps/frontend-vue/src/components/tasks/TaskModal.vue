<script setup lang="ts">
import { ref } from 'vue'
import type { Category, Task, TaskInput } from '../../types/api'
import { appendSubtasks, priorityOptions, statusOptions, toCategoryOptions, toFormValues, toTaskInput } from '../../utils/taskUtils'
import SubtaskGenerator from '../ai/SubtaskGenerator.vue'
import Modal from '../ui/Modal.vue'
import CollaboratorPicker from './CollaboratorPicker.vue'
import SelectField from '../ui/SelectField.vue'

const props = defineProps<{
  task: Task | null
  categories: Category[]
  isSaving: boolean
}>()

const emit = defineEmits<{
  submit: [input: TaskInput]
  close: []
}>()

// Copia: toFormValues devuelve el objeto vacío compartido cuando no hay tarea.
const values = ref({ ...toFormValues(props.task) })
const collaboratorIds = ref<string[]>(props.task?.assignedUsers?.map((user) => user.id) ?? [])

function submitLabel() {
  if (props.isSaving) return 'Guardando...'

  return props.task ? 'Guardar cambios' : 'Crear tarea'
}

function handleSubmit() {
  emit('submit', { ...toTaskInput(values.value), collaboratorIds: collaboratorIds.value })
}

// Las subtareas generadas se añaden al final de la descripción; se guardan al guardar la tarea.
function acceptSubtasks(subtasks: string[]) {
  values.value.description = appendSubtasks(values.value.description, subtasks)
}
</script>

<template>
  <Modal :title="task ? 'Editar tarea' : 'Nueva tarea'" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <label class="block text-sm font-medium">
        Título
        <input v-model="values.title" autofocus class="field" maxlength="120" required type="text" />
      </label>

      <label class="block text-sm font-medium">
        Descripción
        <textarea v-model="values.description" class="field" rows="3" />
      </label>

      <SubtaskGenerator v-if="task" :task-id="task.id" @accept="acceptSubtasks" />

      <div class="grid gap-4 sm:grid-cols-2">
        <SelectField
          :model-value="values.priority"
          :options="priorityOptions"
          label="Prioridad"
          @update:model-value="values.priority = $event"
        />
        <SelectField
          :model-value="values.status"
          :options="statusOptions"
          label="Estado"
          @update:model-value="values.status = $event"
        />
        <SelectField
          :model-value="values.categoryId"
          :options="toCategoryOptions(categories, 'Sin categoría')"
          label="Categoría"
          @update:model-value="values.categoryId = $event"
        />
        <label class="block text-sm font-medium">
          Fecha de vencimiento
          <input v-model="values.dueDate" class="field" type="date" />
        </label>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">Agregar amigo / colaborador</p>
        <CollaboratorPicker v-model="collaboratorIds" />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button class="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800" type="button" @click="emit('close')">
          Cancelar
        </button>
        <button :disabled="isSaving || !values.title.trim()" class="command-button disabled:opacity-60" type="submit">
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  </Modal>
</template>
