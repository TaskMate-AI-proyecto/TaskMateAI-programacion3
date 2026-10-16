import { useCallback, useEffect, useState } from 'react'

export function useProgressStep(isActive: boolean, lastStep: number, intervalMs = 2500) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!isActive) return
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, lastStep)), intervalMs)
    return () => window.clearInterval(timer)
  }, [isActive, lastStep, intervalMs])

  const reset = useCallback(() => setStep(0), [])

  return { step, reset }
}
