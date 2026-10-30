<script setup lang="ts">
import { ArrowRight, Mail } from 'lucide-vue-next'
import IconField from '../ui/IconField.vue'

defineProps<{ isRegister: boolean; isSubmitting: boolean }>()
const name = defineModel<string>('name', { required: true })
const email = defineModel<string>('email', { required: true })
const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <label v-if="isRegister" class="block text-sm font-medium text-slate-300">
      Nombre
      <input v-model="name" autocomplete="name" class="field" required />
    </label>
    <IconField
      v-model="email"
      autocomplete="email"
      label="Correo electrónico"
      :icon="Mail"
      required
      type="email"
    />
    <button class="command-button w-full justify-center rounded-2xl py-3 hover:shadow-[0_0_28px_-6px_rgba(139,92,246,0.75)] disabled:opacity-60" :disabled="isSubmitting" type="submit">
      {{ isSubmitting ? 'Enviando...' : 'Enviar código' }}
      <ArrowRight aria-hidden :size="18" />
    </button>
  </form>
</template>
