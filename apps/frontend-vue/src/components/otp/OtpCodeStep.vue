<script setup lang="ts">
import { computed } from 'vue'
import GlassyOTP from './GlassyOTP.vue'
import type { OtpStatus } from './otpInput'

const props = defineProps<{ status: OtpStatus }>()

const emit = defineEmits<{
  change: [code: string]
  complete: [code: string]
  'success-done': []
  back: []
}>()

// Mientras se verifica o se confirma no se puede cambiar de correo.
const busy = computed(() => props.status === 'verifying' || props.status === 'success')
</script>

<template>
  <div class="space-y-5">
    <GlassyOTP
      :status="status"
      @change="emit('change', $event)"
      @complete="emit('complete', $event)"
      @success-done="emit('success-done')"
    />
    <button :disabled="busy" class="text-link text-sm disabled:opacity-50" type="button" @click="emit('back')">
      Cambiar correo
    </button>
  </div>
</template>
