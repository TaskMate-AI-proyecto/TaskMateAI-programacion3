import { useEffect, useRef } from 'react'

// Ejecuta callback cada intervalMs mientras la ventana está visible (sin recargar la página).
export function usePolling(callback: () => void, intervalMs: number) {
  const latest = useRef(callback)

  useEffect(() => {
    latest.current = callback
  })

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') latest.current()
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs])
}
