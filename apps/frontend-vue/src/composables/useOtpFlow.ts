import { ref } from 'vue'
import { sendOtp, verifyOtp } from '../api/auth'
import { getApiErrorMessage } from '../api/errors'
import type { OtpStep } from '../components/otp/otpCopy'
import type { OtpStatus } from '../components/otp/otpInput'
import type { AuthResponse } from '../types/auth'

interface OtpFlowOptions {
  onSession: (session: AuthResponse) => void
}

// Máquina de estados del login OTP: paso 1 pide el código por correo, paso 2 lo verifica con estados animados.
export function useOtpFlow({ onSession }: OtpFlowOptions) {
  const name = ref('')
  const email = ref('')
  const step = ref<OtpStep>('email')
  const isSubmitting = ref(false)
  const message = ref<string | null>(null)
  const error = ref<string | null>(null)
  const otpStatus = ref<OtpStatus>('idle')
  // La sesión se guarda al terminar la animación de éxito (completeLogin), no al recibirla.
  let pendingSession: AuthResponse | null = null

  async function requestCode() {
    isSubmitting.value = true
    error.value = null

    try {
      message.value = null
      await sendOtp(email.value)
      step.value = 'code'
      message.value = `Enviamos un código de seis dígitos a ${email.value}.`
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError)
    } finally {
      isSubmitting.value = false
    }
  }

  async function verifyCode(code: string) {
    error.value = null
    otpStatus.value = 'verifying'

    try {
      pendingSession = await verifyOtp(email.value, code)
      otpStatus.value = 'success'
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError)
      otpStatus.value = 'error'
    }
  }

  function completeLogin() {
    if (pendingSession) onSession(pendingSession)
  }

  // Al volver a escribir tras un error se vuelve a estado normal.
  function resetOtpStatus() {
    if (otpStatus.value === 'error') otpStatus.value = 'idle'
    error.value = null
  }

  function backToEmail() {
    step.value = 'email'
    otpStatus.value = 'idle'
    error.value = null
  }

  return {
    name,
    email,
    step,
    isSubmitting,
    message,
    error,
    otpStatus,
    requestCode,
    verifyCode,
    completeLogin,
    resetOtpStatus,
    backToEmail,
  }
}
