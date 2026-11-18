<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useOtpFlow } from '../composables/useOtpFlow'
import { useAuthStore } from '../stores/auth'
import type { AuthMode } from '../types/auth'
import OtpCodeStep from './otp/OtpCodeStep.vue'
import OtpEmailStep from './otp/OtpEmailStep.vue'
import OtpHeader from './otp/OtpHeader.vue'
import OtpSwitchLink from './otp/OtpSwitchLink.vue'

// Panel de un formulario (login o registro). Los dos paneles comparten tarjeta en AuthView; el oculto queda inerte.
const props = withDefaults(defineProps<{ mode: AuthMode; isActive?: boolean }>(), { isActive: true })

const emit = defineEmits<{ 'switch-mode': [] }>()

const router = useRouter()
const auth = useAuthStore()

const flow = useOtpFlow({
  onSession(session) {
    auth.setSession(session)
    void router.replace('/dashboard')
  },
})
const { name, email, step, isSubmitting, message, error, otpStatus, requestCode, verifyCode, completeLogin, resetOtpStatus, backToEmail } = flow
</script>

<template>
  <section
    :class="[
      'verso-panel col-start-1 row-start-1 flex flex-col justify-center gap-5 md:w-1/2',
      mode === 'login' ? 'md:justify-self-start' : 'md:justify-self-end',
      { inert: !isActive },
    ]"
    :inert="!isActive"
  >
    <OtpHeader :is-active="isActive" :mode="props.mode" :step="step" />
    <p v-if="message" class="animate-fade-up flex items-center gap-2 rounded-2xl border border-mint/25 bg-mint/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
      <CheckCircle2 aria-hidden :size="17" />
      {{ message }}
    </p>
    <p v-if="error" aria-live="polite" class="animate-fade-up rounded-2xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{{ error }}</p>
    <!-- La clave por paso vuelve a montar el formulario y reproduce la entrada al cambiar de correo a código. -->
    <div :key="step" class="animate-fade-up">
      <OtpEmailStep
        v-if="step === 'email'"
        v-model:email="email"
        v-model:name="name"
        :is-register="props.mode === 'register'"
        :is-submitting="isSubmitting"
        @submit="requestCode"
      />
      <OtpCodeStep
        v-else
        :status="otpStatus"
        @back="backToEmail"
        @change="resetOtpStatus"
        @complete="verifyCode"
        @success-done="completeLogin"
      />
    </div>
    <OtpSwitchLink :mode="props.mode" @switch-mode="emit('switch-mode')" />
  </section>
</template>
