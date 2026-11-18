<script setup lang="ts">
import { ref } from 'vue'
import { Tags } from 'lucide-vue-next'
import { createCategory, deleteCategory, updateCategory } from '../../api/categoriesApi'
import { getApiErrorMessage } from '../../api/errors'
import { useToastStore } from '../../stores/toast'
import type { Category, CategoryInput } from '../../types/api'
import Modal from '../ui/Modal.vue'
import CategoryForm from './CategoryForm.vue'
import CategoryRow from './CategoryRow.vue'

const props = defineProps<{ categories: Category[] }>()

const emit = defineEmits<{ changed: []; close: [] }>()

const toast = useToastStore()
const editing = ref<Category | null>(null)
// Cambiar la clave de la fila de formulario lo vuelve a montar vacío (tras crear, cancelar o borrar).
const formKey = ref(0)
const isSaving = ref(false)

function resetForm() {
  editing.value = null
  formKey.value += 1
}

function saveCategory(current: Category | null, input: Required<CategoryInput>) {
  return current ? updateCategory(current.id, input) : createCategory(input)
}

async function handleSubmit(input: Required<CategoryInput>) {
  const current = editing.value
  isSaving.value = true

  try {
    await saveCategory(current, input)
    toast.notify(current ? 'Categoría actualizada' : 'Categoría creada')
    resetForm()
    emit('changed')
  } catch (error) {
    toast.notify(getApiErrorMessage(error), 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(category: Category) {
  isSaving.value = true

  try {
    await deleteCategory(category.id)
    toast.notify('Categoría eliminada')
    if (editing.value?.id === category.id) resetForm()
    emit('changed')
  } catch (error) {
    toast.notify(getApiErrorMessage(error, 'No se pudo eliminar. Si tiene tareas asociadas, reasígnalas primero.'), 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Modal title="Categorías" @close="emit('close')">
    <div v-if="categories.length === 0" class="empty-state mb-5 min-h-32 rounded-md">
      <Tags :size="24" />
      <p class="text-sm">Todavía no hay categorías. Crea una abajo.</p>
    </div>
    <ul v-else class="mb-5 space-y-2">
      <CategoryRow
        v-for="category in categories"
        :key="category.id"
        :category="category"
        :is-busy="isSaving"
        @delete="handleDelete"
        @edit="editing = $event"
      />
    </ul>
    <CategoryForm
      :key="`${editing?.id ?? 'new'}-${formKey}`"
      :editing="editing"
      :is-saving="isSaving"
      @cancel="resetForm"
      @submit="handleSubmit"
    />
  </Modal>
</template>
