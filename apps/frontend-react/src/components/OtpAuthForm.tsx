import { useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { sendOtp, verifyOtp } from '../api/auth'
import { getApiErrorMessage } from '../api/errors'
import { useAuth } from '../hooks/useAuth'
import { OtpHeader, OtpSwitchLink } from './otp/OtpHeader'
import { OtpCodeStep, OtpEmailStep } from './otp/OtpSteps'
import type { AuthMode, OtpStep } from './otp/otpCopy'

export function OtpAuthForm({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<OtpStep>('email')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const submitCode = (event: FormEvent<HTMLFormElement>) => runStep(event, async () => {
    const response = await verifyOtp(email, code)
    login(response.token, response.user)
    navigate('/dashboard', { replace: true })
  })

  function backToEmail() {
    setStep('email')
    setCode('')
    setError(null)
  }

  return (
    <main className="auth-page">
      <Link className="font-display text-xl font-semibold tracking-wide" to="/dashboard">TaskMate</Link>
      <div className="max-w-md space-y-5">
        <OtpHeader mode={mode} step={step} />
        {message && <p className="flex items-center gap-2 rounded-md border border-mint/25 bg-mint/10 p-3 text-sm text-mint"><CheckCircle2 size={17} />{message}</p>}
        {error && <p aria-live="polite" className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{error}</p>}
        {step === 'email'
          ? <OtpEmailStep email={email} isRegister={mode === 'register'} isSubmitting={isSubmitting} name={name} onEmailChange={setEmail} onNameChange={setName} onSubmit={requestCode} />
          : <OtpCodeStep code={code} isSubmitting={isSubmitting} onBack={backToEmail} onCodeChange={setCode} onSubmit={submitCode} />}
        <OtpSwitchLink mode={mode} />
      </div>
    </main>
  )
}
