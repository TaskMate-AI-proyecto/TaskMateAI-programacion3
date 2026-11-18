import { useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent, type RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import {
  clearDigit,
  codeOf,
  emptyDigits,
  isComplete,
  nextIndex,
  onlyDigits,
  otpLength,
  pasteDigits,
  previousIndex,
  writeDigit,
  type OtpStatus,
} from './otpInput'

// Tarjetas de cristal: la misma base para las casillas y para las tarjetas que giran al verificar.
const cardClass = 'grid h-14 w-11 place-items-center rounded-2xl border border-glass/20 bg-glass/10 backdrop-blur-xl'
const inputClass = `${cardClass} text-center font-display text-2xl font-semibold text-slate-100 outline-none transition focus:border-glass/40 focus:shadow-[0_0_20px_-4px_rgb(var(--glass-rgb)/0.45)]`
const arrowMoves: Record<string, (index: number) => number> = { ArrowLeft: previousIndex, ArrowRight: nextIndex }

function isEntry(status: OtpStatus) {
  return status === 'idle' || status === 'error'
}

function VerifyingCards() {
  return (
    <motion.div animate={{ opacity: 1 }} className="flex gap-2" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
      {Array.from({ length: otpLength }, (_, index) => (
        <motion.div
          animate={{ rotate: 360, y: [0, -20, 0] }}
          className={cardClass}
          key={index}
          transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, delay: index * 0.1 }}
        />
      ))}
    </motion.div>
  )
}

function SuccessMark({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      animate={{ scale: 1 }}
      className="grid h-14 w-14 place-items-center rounded-full border border-mint/40 bg-mint/20 text-emerald-700 dark:text-emerald-300"
      exit={{ opacity: 0 }}
      initial={{ scale: 0 }}
      onAnimationComplete={onDone}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <Check size={28} />
    </motion.div>
  )
}

interface DigitRowProps {
  digits: string[]
  status: OtpStatus
  onDigitChange: (index: number, event: ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void
  onPaste: (index: number, event: ClipboardEvent<HTMLInputElement>) => void
  inputs: RefObject<(HTMLInputElement | null)[]>
}

// Fila de casillas: entra con fundido y, tras un error, se sacude.
function DigitRow({ digits, status, onDigitChange, onKeyDown, onPaste, inputs }: DigitRowProps) {
  return (
    <motion.div
      animate={{ opacity: 1, x: status === 'error' ? [0, -12, 12, -8, 8, 0] : 0 }}
      aria-label="Código de verificación"
      className="flex gap-2"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      key={status}
      role="group"
      transition={{ duration: 0.5 }}
    >
      {digits.map((digit, index) => (
        <input
          aria-label={`Dígito ${index + 1} del código`}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={index === 0}
          className={inputClass}
          inputMode="numeric"
          key={index}
          onChange={(event) => onDigitChange(index, event)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={(event) => onPaste(index, event)}
          ref={(node) => {
            inputs.current[index] = node
          }}
          type="text"
          value={digit}
        />
      ))}
    </motion.div>
  )
}

interface OtpViewProps extends Omit<DigitRowProps, 'inputs'> {
  onSuccessDone: () => void
}

// Qué se muestra según el estado: casillas (idle/error), tarjetas que giran (verifying) o la marca de éxito.
function OtpView({ status, onSuccessDone, ...rowProps }: OtpViewProps & { inputs: DigitRowProps['inputs'] }) {
  return (
    <AnimatePresence mode="wait">
      {status === 'verifying' && <VerifyingCards key="verifying" />}
      {status === 'success' && <SuccessMark key="success" onDone={onSuccessDone} />}
      {isEntry(status) && <DigitRow key="entry" status={status} {...rowProps} />}
    </AnimatePresence>
  )
}

interface GlassyOTPProps {
  status: OtpStatus
  onChange: (code: string) => void
  onComplete: (code: string) => void
  onSuccessDone: () => void
}

// Código de seis casillas con navegación por teclado, pegado completo y estados animados.
export function GlassyOTP({ status, onChange, onComplete, onSuccessDone }: GlassyOTPProps) {
  const [digits, setDigits] = useState(emptyDigits)
  const [lastStatus, setLastStatus] = useState(status)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Tras un error el código se vacía para volver a intentarlo (ajuste de estado durante el render, sin efecto).
  if (status !== lastStatus) {
    setLastStatus(status)
    if (status === 'error') setDigits(emptyDigits())
  }

  function focusInput(index: number) {
    inputs.current[index]?.focus()
  }

  function update(next: string[]) {
    const code = codeOf(next)
    setDigits(next)
    onChange(code)
    if (isComplete(next)) onComplete(code)
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const next = writeDigit(digits, index, event.target.value)
    update(next)
    if (next[index]) focusInput(nextIndex(index))
  }

  function handleBackspace(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (digits[index] !== '' || index === 0) return

    event.preventDefault()
    update(clearDigit(digits, index - 1))
    focusInput(previousIndex(index))
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') handleBackspace(index, event)

    const move = arrowMoves[event.key]
    if (move) focusInput(move(index))
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const text = event.clipboardData.getData('text')
    update(pasteDigits(digits, index, text))
    focusInput(Math.min(index + onlyDigits(text).length, otpLength - 1))
  }

  return (
    <div className="flex min-h-14 items-center justify-center">
      <OtpView
        digits={digits}
        inputs={inputs}
        onDigitChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onSuccessDone={onSuccessDone}
        status={status}
      />
    </div>
  )
}
