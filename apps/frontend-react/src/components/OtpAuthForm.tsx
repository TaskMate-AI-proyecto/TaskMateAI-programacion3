import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sendOtp, verifyOtp } from '../api/auth'
import { getApiErrorMessage } from '../api/errors'
import { useAuth } from '../hooks/useAuth'
import type { AuthResponse } from '../types/api'
import { cn } from '../utils/cn'
import { OtpHeader, OtpSwitchLink } from './otp/OtpHeader'
import { OtpCodeStep, OtpEmailStep } from './otp/OtpSteps'
import type { AuthMode, OtpStep } from './otp/otpCopy'
import type { OtpStatus } from './otp/otpInput'

// Mensaje de éxito y de error del paso actual.
function Feedback({ message, error }: { message: string | null; error: string | null }) {
  return (
    <>
      {message && <p className="animate-fade-up flex items-center gap-2 rounded-2xl border border-mint/25 bg-mint/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={17} />{message}</p>}
      {error && <p aria-live="polite" className="animate-fade-up rounded-2xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{error}</p>}
    </>
  )
}

// El panel oculto recibe la clase .inert (sin interacción ni opacidad); el activo, sólo la base.
// En escritorio cada panel ocupa su mitad: login a la izquierda, registro a la derecha.
function panelClass(mode: AuthMode, isActive: boolean) {
  return cn(
    'verso-panel col-start-1 row-start-1 flex flex-col justify-center gap-5 md:w-1/2',
    mode === 'login' ? 'md:justify-self-start' : 'md:justify-self-end',
    !isActive && 'inert',
  )
}

interface OtpAuthFormProps {
  mode: AuthMode
  isActive?: boolean
  onSwitch: () => void
}

// Panel de un formulario (login o registro). Los dos paneles comparten tarjeta en AuthView; el oculto queda inerte.
export function OtpAuthForm({ mode, isActive = true, onSwitch }: OtpAuthFormProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<OtpStep>('email')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [otpStatus, setOtpStatus] = useState<OtpStatus>('idle')
  // La sesión se guarda al terminar la animación de éxito: antes, la ruta pública redirigiría de inmediato.
  const pendingSession = useRef<AuthResponse | null>(null)

  async function runStep(event: FormEvent<HTMLFormElement>, action: () => Promise<void>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await action()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestCode = (event: FormEvent<HTMLFormElement>) => runStep(event, async () => {
    setMessage(null)
    await sendOtp(email)
    setStep('code')
    setMessage(`Enviamos un código de seis dígitos a ${email}.`)
  })

  async function submitCode(value: string) {
    setError(null)
    setOtpStatus('verifying')
    try {
      pendingSession.current = await verifyOtp(email, value)
      setOtpStatus('success')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
      setOtpStatus('error')
    }
  }

  function finishLogin() {
    const session = pendingSession.current
    if (!session) return

    login(session.token, session.user)
    navigate('/dashboard', { replace: true })
  }

  // Al escribir de nuevo tras un error se vuelve a estado normal.
  function resetOtpStatus() {
    setOtpStatus((current) => (current === 'error' ? 'idle' : current))
    setError(null)
  }

  function backToEmail() {
    setStep('email')
    setOtpStatus('idle')
    setError(null)
  }

  return (
    <section className={panelClass(mode, isActive)} inert={!isActive}>
      <OtpHeader isActive={isActive} mode={mode} step={step} />
      <Feedback error={error} message={message} />
      {/* La clave por paso vuelve a montar el formulario y reproduce la entrada al cambiar de correo a código. */}
      <div className="animate-fade-up" key={step}>
        {step === 'email'
          ? <OtpEmailStep email={email} isRegister={mode === 'register'} isSubmitting={isSubmitting} name={name} onEmailChange={setEmail} onNameChange={setName} onSubmit={requestCode} />
          : <OtpCodeStep onBack={backToEmail} onChange={resetOtpStatus} onComplete={(value) => void submitCode(value)} onSuccessDone={finishLogin} status={otpStatus} />}
      </div>
      <OtpSwitchLink mode={mode} onSwitch={onSwitch} />
    </section>
  )
}
