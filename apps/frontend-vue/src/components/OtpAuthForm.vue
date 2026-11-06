<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import { useOtpFlow } from '../composables/useOtpFlow'
import { useAuthStore } from '../stores/auth'
import type { AuthMode } from '../types/auth'
import Atmosphere from './layout/Atmosphere.vue'
import OtpCodeStep from './otp/OtpCodeStep.vue'
import OtpEmailStep from './otp/OtpEmailStep.vue'
import OtpHeader from './otp/OtpHeader.vue'
import OtpSwitchLink from './otp/OtpSwitchLink.vue'

const props = defineProps<{ mode: AuthMode }>()

const router = useRouter()
const auth = useAuthStore()

const flow = useOtpFlow({
  onSession(session) {
    auth.setSession(session)
    void router.replace('/dashboard')
  },
})
const { name, email, code, step, isSubmitting, message, error, canVerify } = flow
</script>

<template>
  <main class="auth-page">
    <Atmosphere />
    <RouterLink class="relative z-10 font-display text-xl font-semibold tracking-wide text-slate-100" to="/dashboard">
      TaskMate
    </RouterLink>
    <div class="glass-card relative z-10 w-full space-y-5 rounded-3xl p-8 shadow-[0_0_48px_-16px_rgba(99,102,241,0.45)]">
      <OtpHeader :mode="props.mode" :step="step" />
      <p v-if="message" class="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">
        <CheckCircle2 aria-hidden :size="17" />
        {{ message }}
      </p>
      <p v-if="error" aria-live="polite" class="rounded-2xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{{ error }}</p>
      <OtpEmailStep
        v-if="step === 'email'"
        v-model:email="email"
        v-model:name="name"
        :is-register="props.mode === 'register'"
        :is-submitting="isSubmitting"
        @submit="flow.requestCode"
      />
      <OtpCodeStep
        v-else
        :can-verify="canVerify"
        :is-submitting="isSubmitting"
        :model-value="code"
        @back="flow.backToEmail"
        @submit="flow.verifyCode"
        @update:model-value="flow.setCode"
      />
      <OtpSwitchLink :mode="props.mode" />
    </div>
  </main>
</template>
