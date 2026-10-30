import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { SmoothScrollContext, type SmoothScrollContextValue } from './smoothScrollContext'

gsap.registerPlugin(ScrollTrigger)

// Lenis aporta la inercia del scroll y se sincroniza con el ticker de GSAP,
// así los triggers de ScrollTrigger se recalculan con la posición suavizada.
function startSmoothScroll() {
  const lenis = new Lenis({ duration: 1.2, smoothWheel: true })
  const tick = (time: number) => lenis.raf(time * 1000)

  lenis.on('scroll', () => ScrollTrigger.update())
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return {
    lenis,
    destroy: () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    },
  }
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  const lenisRef = useRef<Lenis | null>(null)
  const lockCount = useRef(0)

  useEffect(() => {
    if (reduceMotion) return

    const smooth = startSmoothScroll()
    lenisRef.current = smooth.lenis
    if (lockCount.current > 0) smooth.lenis.stop()

    return () => {
      lenisRef.current = null
      smooth.destroy()
    }
  }, [reduceMotion])

  const value = useMemo<SmoothScrollContextValue>(() => ({
    lockScroll: () => {
      lockCount.current += 1
      lenisRef.current?.stop()
    },
    unlockScroll: () => {
      lockCount.current = Math.max(0, lockCount.current - 1)
      if (lockCount.current === 0) lenisRef.current?.start()
    },
  }), [])

  return <SmoothScrollContext value={value}>{children}</SmoothScrollContext>
}
