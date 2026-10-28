import { render, screen } from '@testing-library/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollyHero } from './ScrollyHero'

const lenis = vi.hoisted(() => ({
  constructor: vi.fn(),
  on: vi.fn(),
  raf: vi.fn(),
  destroy: vi.fn(),
}))

vi.mock('lenis', () => ({
  default: class {
    on = lenis.on
    raf = lenis.raf
    destroy = lenis.destroy

    constructor(options: unknown) {
      lenis.constructor(options)
    }
  },
}))

function setReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({ matches: reduce && query.includes('reduce'), media: query }) as unknown as MediaQueryList,
  )
}

function renderHero() {
  return render(<ScrollyHero card={<p>Tarjeta principal</p>} header={<p>Encabezado</p>} />)
}

describe('ScrollyHero', () => {
  beforeEach(() => {
    setReducedMotion(false)
  })

  it('renders the header and the card inside the main landmark', () => {
    renderHero()

    expect(screen.getByRole('main')).toContainElement(screen.getByText('Encabezado'))
    expect(screen.getByRole('main')).toContainElement(screen.getByText('Tarjeta principal'))
  })

  it('pins the card with ScrollTrigger and releases it on unmount', () => {
    const { unmount } = renderHero()

    expect(ScrollTrigger.getAll()).toHaveLength(1)

    unmount()

    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })

  it('starts smooth scrolling with Lenis and destroys it on unmount', () => {
    const { unmount } = renderHero()

    expect(lenis.constructor).toHaveBeenCalledWith(expect.objectContaining({ smoothWheel: true }))

    unmount()

    expect(lenis.destroy).toHaveBeenCalledTimes(1)
  })

  it('skips pinning and smooth scrolling when the user prefers reduced motion', () => {
    setReducedMotion(true)

    renderHero()

    expect(ScrollTrigger.getAll()).toHaveLength(0)
    expect(lenis.constructor).not.toHaveBeenCalled()
    expect(screen.getByText('Tarjeta principal')).toBeInTheDocument()
  })
})
