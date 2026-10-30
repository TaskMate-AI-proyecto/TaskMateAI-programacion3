import type { FormEvent } from 'react'
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react'
import { IconField } from '../ui/IconField'
import { fieldClass } from '../ui/fieldClass'

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
          <input autoComplete="name" className={fieldClass} onChange={(event) => onNameChange(event.target.value)} required value={name} />
        </label>
      )}
      <IconField autoComplete="email" icon={Mail} label="Correo electrónico" onChange={(event) => onEmailChange(event.target.value)} required type="email" value={email} />
      <SubmitButton busyLabel="Enviando..." isBusy={isSubmitting} label="Enviar código" />
    </form>
  )
}

interface OtpCodeStepProps {
  code: string
  isSubmitting: boolean
  onCodeChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

export function OtpCodeStep({ code, isSubmitting, onCodeChange, onSubmit, onBack }: OtpCodeStepProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <IconField className="tracking-[0.35em]" icon={ShieldCheck} inputMode="numeric" label="Código de verificación" maxLength={6} onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, ''))} pattern="\d{6}" required value={code} />
      <SubmitButton busyLabel="Verificando..." disabled={code.length !== 6} isBusy={isSubmitting} label="Verificar y continuar" />
      <button className="text-link text-sm" onClick={onBack} type="button">Cambiar correo</button>
    </form>
  )
}
