<script setup lang="ts">
import { ArrowRight, ShieldCheck } from 'lucide-vue-next'
import IconField from '../ui/IconField.vue'

const props = defineProps<{ isSubmitting: boolean; canVerify: boolean }>()
const code = defineModel<string>({ required: true })
const emit = defineEmits<{ submit: []; back: [] }>()
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <IconField
      v-model="code"
      autocomplete="one-time-code"
      inputmode="numeric"
      input-class="tracking-[0.35em]"
      label="Código de verificación"
      maxlength="6"
      pattern="\d{6}"
      required
      :icon="ShieldCheck"
    />
    <button class="command-button w-full justify-center rounded-2xl py-3 hover:shadow-[0_0_28px_-6px_rgba(139,92,246,0.75)] disabled:opacity-60" :disabled="isSubmitting || !props.canVerify" type="submit">
      {{ isSubmitting ? 'Verificando...' : 'Verificar y continuar' }}
      <ArrowRight aria-hidden :size="18" />
    </button>
    <button class="text-link text-sm" type="button" @click="emit('back')">Cambiar correo</button>
  </form>
</template>
