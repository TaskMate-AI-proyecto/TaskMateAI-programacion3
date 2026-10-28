import { useEffect, useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface ScrollyHeroProps {
  header: ReactNode
  card: ReactNode
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Lenis aporta la inercia del scroll y se sincroniza con el ticker de GSAP.
function startSmoothScroll() {
  const lenis = new Lenis({ duration: 1.2, smoothWheel: true })
  const tick = (time: number) => lenis.raf(time * 1000)

  lenis.on('scroll', () => ScrollTrigger.update())
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    lenis.destroy()
  }
}

// La tarjeta pasa de inclinada y pequeña a plana y a tamaño completo mientras la sección está fijada.
function pinCardOnScroll(stage: HTMLElement, card: HTMLElement) {
  gsap.fromTo(
    card,
    { rotateX: 18, scale: 0.9, transformPerspective: 1200, transformOrigin: '50% 0%' },
    {
      rotateX: 0,
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top top', end: '+=100%', pin: true, scrub: true },
    },
  )
}

export function ScrollyHero({ header, card }: ScrollyHeroProps) {
  const stageRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion() || !stageRef.current || !cardRef.current) return

    pinCardOnScroll(stageRef.current, cardRef.current)
  }, { scope: stageRef })

  useEffect(() => {
    if (prefersReducedMotion()) return

    return startSmoothScroll()
  }, [])

  return (
    <main ref={stageRef} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 py-16 text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-mint/20 blur-[130px]" />
        <div className="absolute bottom-[-18%] right-[6%] h-[440px] w-[440px] rounded-full bg-coral/20 blur-[130px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        {header}
        <div ref={cardRef} className="mt-12 w-full will-change-transform">
          {card}
        </div>
      </div>
    </main>
  )
}
