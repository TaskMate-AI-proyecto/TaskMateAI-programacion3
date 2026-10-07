import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { sendOtp, verifyOtp } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

interface OtpAuthFormProps {
  mode: 'login' | 'register'
}

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? 'No se pudo completar la solicitud.'
  return 'No se pudo completar la solicitud.'
}

export function OtpAuthForm({ mode }: OtpAuthFormProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isRegister = mode === 'register'

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)
    try {
      await sendOtp(email)
      setStep('code')
      setMessage(`Enviamos un código de seis dígitos a ${email}.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await verifyOtp(email, code)
      login(response.token, response.user)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <Link className="font-display text-xl font-semibold tracking-wide" to="/dashboard">TaskMate</Link>
      <div className="max-w-md space-y-5">
        <div><p className="eyebrow">{isRegister ? 'Crear cuenta' : 'Acceso seguro'}</p><h1 className="font-display text-4xl font-semibold">{step === 'code' ? 'Revisa tu correo.' : isRegister ? 'Crea tu espacio.' : 'Bienvenido de nuevo.'}</h1><p className="mt-3 text-ink/65">{step === 'code' ? 'Ingresa el código temporal para continuar.' : isRegister ? 'Regístrate con tu nombre y correo para comenzar.' : 'Usa tu correo y te enviaremos un código de acceso.'}</p></div>
        {message && <p className="flex items-center gap-2 rounded-md border border-mint/25 bg-mint/10 p-3 text-sm text-mint"><CheckCircle2 size={17} />{message}</p>}
        {error && <p aria-live="polite" className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{error}</p>}
        {step === 'email' ? (
          <form className="space-y-4" onSubmit={requestCode}>
            {isRegister && <label className="block text-sm font-medium">Nombre<input autoComplete="name" className="mt-1.5 w-full rounded-md border border-ink/20 bg-white px-3 py-2.5 outline-none focus:border-ink" onChange={(event) => setName(event.target.value)} required value={name} /></label>}
            <label className="block text-sm font-medium">Correo electrónico<div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" size={17} /><input autoComplete="email" className="w-full rounded-md border border-ink/20 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-ink" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></div></label>
            <button className="command-button w-full justify-center" disabled={isSubmitting} type="submit">{isSubmitting ? 'Enviando...' : 'Enviar código'}<ArrowRight size={18} /></button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={submitCode}>
            <label className="block text-sm font-medium">Código de verificación<div className="relative mt-1.5"><ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" size={17} /><input className="w-full rounded-md border border-ink/20 bg-white py-2.5 pl-10 pr-3 tracking-[0.35em] outline-none focus:border-ink" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} pattern="\d{6}" required value={code} /></div></label>
            <button className="command-button w-full justify-center" disabled={isSubmitting || code.length !== 6} type="submit">{isSubmitting ? 'Verificando...' : 'Verificar y continuar'}<ArrowRight size={18} /></button>
            <button className="text-link text-sm" onClick={() => { setStep('email'); setCode(''); setError(null) }} type="button">Cambiar correo</button>
          </form>
        )}
        <p className="text-sm text-ink/60">{isRegister ? '¿Ya tienes una cuenta?' : '¿Es tu primera vez?'} <Link className="text-link" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Inicia sesión' : 'Regístrate'}</Link></p>
      </div>
    </main>
  )
}