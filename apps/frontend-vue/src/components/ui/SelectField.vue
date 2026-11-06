<script setup lang="ts" generic="T extends string">
import type { SelectOption } from '../../utils/taskUtils'

defineProps<{
  label: string
  modelValue: T
  options: SelectOption<T>[]
  hideLabel?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <label class="block text-sm font-medium text-slate-300">
    <span v-if="hideLabel" class="sr-only">{{ label }}</span>
    <span v-else>{{ label }}</span>
    <select
      :class="['field', hideLabel && '!mt-0']"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value as T)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>
