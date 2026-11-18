export type OtpStatus = 'idle' | 'verifying' | 'success' | 'error'

// El backend exige exactamente seis dígitos (POST /api/auth/verify-code).
export const otpLength = 6

export function emptyDigits(): string[] {
  return Array.from({ length: otpLength }, () => '')
}

export function onlyDigits(text: string) {
  return text.replace(/\D/g, '')
}

export function nextIndex(index: number) {
  return Math.min(index + 1, otpLength - 1)
}

export function previousIndex(index: number) {
  return Math.max(index - 1, 0)
}

// Escribe el último dígito introducido en la casilla index; lo que no sea dígito se descarta.
export function writeDigit(digits: string[], index: number, raw: string) {
  const digit = onlyDigits(raw).slice(-1)

  return digits.map((value, position) => (position === index ? digit : value))
}

export function clearDigit(digits: string[], index: number) {
  return digits.map((value, position) => (position === index ? '' : value))
}

// Reparte un texto pegado desde la casilla index. Los caracteres que no son dígitos se ignoran.
export function pasteDigits(digits: string[], index: number, text: string) {
  const chars = onlyDigits(text)

  return digits.map((value, position) => {
    const offset = position - index

    return offset >= 0 && offset < chars.length ? chars[offset] : value
  })
}

export function isComplete(digits: string[]) {
  return digits.every((digit) => digit !== '')
}

export function codeOf(digits: string[]) {
  return digits.join('')
}
