import { Link } from 'react-router-dom'
import { authCopy, codeStepCopy, switchCopy, type AuthMode, type OtpStep } from './otpCopy'

export function OtpHeader({ mode, step }: { mode: AuthMode; step: OtpStep }) {
  const text = step === 'code' ? codeStepCopy : authCopy[mode].email

  return (
    <div>
      <p className="eyebrow">{authCopy[mode].eyebrow}</p>
      <h1 className="font-display text-4xl font-semibold text-slate-100">{text.title}</h1>
      <p className="mt-3 text-slate-400">{text.subtitle}</p>
    </div>
  )
}

export function OtpSwitchLink({ mode }: { mode: AuthMode }) {
  const { question, label, to } = switchCopy[mode]

  return <p className="text-sm text-slate-400">{question} <Link className="text-link" to={to}>{label}</Link></p>
}
