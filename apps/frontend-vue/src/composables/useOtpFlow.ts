import { computed, ref } from 'vue'
import { sendOtp, verifyOtp } from '../api/auth'
import { getApiErrorMessage } from '../api/errors'
import type { AuthResponse } from '../types/auth'
import type { OtpStep } from '../components/otp/otpCopy'

const codeLength = 6

interface OtpFlowOptions {
  onSession: (session: AuthResponse) => void
}

// Máquina de estados del login OTP: paso 1 pide el código por correo, paso 2 lo verifica.
export function useOtpFlow({ onSession }: OtpFlowOptions) {
  const name = ref('')
  const email = ref('')
  const code = ref('')
  const step = ref<OtpStep>('email')
  const isSubmitting = ref(false)
  const message = ref<string | null>(null)
  const error = ref<string | null>(null)
  const canVerify = computed(() => code.value.length === codeLength)

  async function run(action: () => Promise<void>) {
    error.value = null
    isSubmitting.value = true

    try {
      await action()
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError)
    } finally {
      isSubmitting.value = false
    }
  }

  function requestCode() {
    return run(async () => {
      message.value = null
      await sendOtp(email.value)
      step.value = 'code'
      message.value = `Enviamos un código de seis dígitos a ${email.value}.`
    })
  }

  function verifyCode() {
    return run(async () => {
      onSession(await verifyOtp(email.value, code.value))
    })
  }

  function backToEmail() {
    step.value = 'email'
    code.value = ''
    error.value = null
  }

  // Sólo dígitos y como máximo seis, igual que el campo de la app React.
  function setCode(value: string) {
    code.value = value.replace(/\D/g, '').slice(0, codeLength)
  }

  return {
    name,
    email,
    code,
    step,
    isSubmitting,
    message,
    error,
    canVerify,
    requestCode,
    verifyCode,
    backToEmail,
    setCode,
  }
}
