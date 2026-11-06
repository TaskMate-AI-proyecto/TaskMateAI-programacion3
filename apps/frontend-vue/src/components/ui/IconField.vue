<script setup lang="ts">
import type { Component } from 'vue'

// Campo con ícono a la izquierda. Los atributos (type, autocomplete, required...) van al input.
defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
  icon: Component
  modelValue: string
  inputClass?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label class="block text-sm font-medium text-slate-300">
    {{ label }}
    <div class="relative mt-1.5">
      <component :is="icon" aria-hidden class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" :size="17" />
      <input v-bind="$attrs" class="field pl-10" :class="inputClass" :value="modelValue" @input="onInput" />
    </div>
  </label>
</template>
