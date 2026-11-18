import { Mail, ShieldCheck } from 'lucide-react'
import { authCopy, codeStepCopy, switchCopy, type AuthMode, type OtpStep } from './otpCopy'

// Icono de la etapa con un halo que pulsa detrás; el halo se oculta con prefers-reduced-motion.
// Sólo el panel activo lleva h1: el oculto usa h2 para que la página tenga un único título principal.
export function OtpHeader({ mode, step, isActive = true }: { mode: AuthMode; step: OtpStep; isActive?: boolean }) {
  const text = step === 'code' ? codeStepCopy : authCopy[mode].email
  const Icon = step === 'code' ? ShieldCheck : Mail
  const Heading = isActive ? 'h1' : 'h2'

  return (
    <div>
      <span className="relative mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
        <span aria-hidden className="absolute inset-0 rounded-2xl bg-indigo-500/30 animate-pulse-ring motion-reduce:hidden" />
        <Icon className="relative" size={22} />
      </span>
      <p className="eyebrow">{authCopy[mode].eyebrow}</p>
      <Heading className="font-display text-4xl font-semibold text-slate-100">{text.title}</Heading>
      <p className="mt-3 text-slate-400">{text.subtitle}</p>
    </div>
  )
}

export function OtpSwitchLink({ mode, onSwitch }: { mode: AuthMode; onSwitch: () => void }) {
  const { question, label } = switchCopy[mode]

  return <p className="text-sm text-slate-400">{question} <button className="text-link" onClick={onSwitch} type="button">{label}</button></p>
}
