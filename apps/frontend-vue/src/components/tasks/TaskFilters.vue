<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'
import type { Category } from '../../types/api'
import { priorityFilterOptions, statusFilterOptions, toCategoryOptions, type TaskFilterState } from '../../utils/taskUtils'
import SelectField from '../ui/SelectField.vue'

const props = defineProps<{ modelValue: TaskFilterState; categories: Category[] }>()

const emit = defineEmits<{ 'update:modelValue': [value: TaskFilterState] }>()

const categoryOptions = computed(() => toCategoryOptions(props.categories, 'Todas las categorías'))

function patch(changes: Partial<TaskFilterState>) {
  emit('update:modelValue', { ...props.modelValue, ...changes })
}
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
    <label class="relative block">
      <span class="sr-only">Buscar tareas</span>
      <Search aria-hidden class="absolute left-3 top-1/2 mt-[3px] -translate-y-1/2 text-slate-500" :size="16" />
      <input
        :value="modelValue.search"
        class="field !mt-0 pl-9"
        placeholder="Buscar por título o descripción"
        type="search"
        @input="patch({ search: ($event.target as HTMLInputElement).value })"
      />
    </label>
    <SelectField
      hide-label
      label="Estado"
      :model-value="modelValue.status"
      :options="statusFilterOptions"
      @update:model-value="patch({ status: $event })"
    />
    <SelectField
      hide-label
      label="Categoría"
      :model-value="modelValue.categoryId"
      :options="categoryOptions"
      @update:model-value="patch({ categoryId: $event })"
    />
    <SelectField
      hide-label
      label="Prioridad"
      :model-value="modelValue.priority"
      :options="priorityFilterOptions"
      @update:model-value="patch({ priority: $event })"
    />
  </div>
</template>
