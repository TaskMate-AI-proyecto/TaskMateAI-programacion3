import type { FormEvent } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { IconField } from '../ui/IconField'
import { GlassyOTP } from './GlassyOTP'
import type { OtpStatus } from './otpInput'

interface SubmitButtonProps {
  isBusy: boolean
  busyLabel: string
  label: string
  disabled?: boolean
}

// Botón principal en degradado índigo/violeta con brillo al pasar el cursor.
function SubmitButton({ isBusy, busyLabel, label, disabled = false }: SubmitButtonProps) {
  return (
    <button className="command-button w-full justify-center rounded-2xl py-3 hover:shadow-[0_0_28px_-6px_rgba(139,92,246,0.75)] disabled:opacity-60" disabled={isBusy || disabled} type="submit">
      {isBusy ? busyLabel : label}<ArrowRight size={18} />
    </button>
  )
}

interface OtpEmailStepProps {
  isRegister: boolean
  name: string
  email: string
  isSubmitting: boolean
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function OtpEmailStep({ isRegister, name, email, isSubmitting, onNameChange, onEmailChange, onSubmit }: OtpEmailStepProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {isRegister && (
        <label className="block text-sm font-medium text-slate-300">Nombre
          <input autoComplete="name" className="field" onChange={(event) => onNameChange(event.target.value)} required value={name} />
        </label>
      )}
      <IconField autoComplete="email" icon={Mail} label="Correo electrónico" onChange={(event) => onEmailChange(event.target.value)} required type="email" value={email} />
      <SubmitButton busyLabel="Enviando..." isBusy={isSubmitting} label="Enviar código" />
    </form>
  )
}

interface OtpCodeStepProps {
  status: OtpStatus
  onChange: (code: string) => void
  onComplete: (code: string) => void
  onSuccessDone: () => void
  onBack: () => void
}

// Paso 2: el código se verifica en cuanto se completan las seis casillas.
export function OtpCodeStep({ status, onChange, onComplete, onSuccessDone, onBack }: OtpCodeStepProps) {
  const busy = status === 'verifying' || status === 'success'

  return (
    <div className="space-y-5">
      <GlassyOTP onChange={onChange} onComplete={onComplete} onSuccessDone={onSuccessDone} status={status} />
      <button className="text-link text-sm disabled:opacity-50" disabled={busy} onClick={onBack} type="button">Cambiar correo</button>
    </div>
  )
}
