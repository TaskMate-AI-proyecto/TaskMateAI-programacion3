import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { SmoothScrollProvider } from './SmoothScrollProvider'

const lenis = vi.hoisted(() => ({
  constructor: vi.fn(),
  on: vi.fn(),
  raf: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  destroy: vi.fn(),
}))

vi.mock('lenis', () => ({
  default: class {
    on = lenis.on
    raf = lenis.raf
    start = lenis.start
    stop = lenis.stop
    destroy = lenis.destroy

    constructor(options: unknown) {
      lenis.constructor(options)
    }
  },
}))

function setReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList,
  )
}

function ScrollLockProbe() {
  const { lockScroll, unlockScroll } = useSmoothScroll()

  return (
    <>
      <button onClick={lockScroll} type="button">Bloquear</button>
      <button onClick={unlockScroll} type="button">Desbloquear</button>
    </>
  )
}

function renderWithProvider() {
  render(<SmoothScrollProvider><ScrollLockProbe /></SmoothScrollProvider>)

  return userEvent.setup()
}

describe('SmoothScrollProvider', () => {
  beforeEach(() => {
    setReducedMotion(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts Lenis with smooth wheel and destroys it on unmount', () => {
    const { unmount } = render(<SmoothScrollProvider><p>Contenido</p></SmoothScrollProvider>)

    expect(lenis.constructor).toHaveBeenCalledWith(expect.objectContaining({ smoothWheel: true }))

    unmount()

    expect(lenis.destroy).toHaveBeenCalledTimes(1)
  })

  it('stops smooth scrolling while a modal locks it and restarts it when released', async () => {
    const user = renderWithProvider()

    await user.click(screen.getByRole('button', { name: 'Bloquear' }))
    expect(lenis.stop).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Desbloquear' }))
    expect(lenis.start).toHaveBeenCalledTimes(1)
  })

  it('keeps scroll locked until every nested lock has been released', async () => {
    const user = renderWithProvider()

    await user.click(screen.getByRole('button', { name: 'Bloquear' }))
    await user.click(screen.getByRole('button', { name: 'Bloquear' }))
    await user.click(screen.getByRole('button', { name: 'Desbloquear' }))

    expect(lenis.start).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Desbloquear' }))

    expect(lenis.start).toHaveBeenCalledTimes(1)
  })

  it('does not start Lenis when the user prefers reduced motion', () => {
    setReducedMotion(true)

    render(<SmoothScrollProvider><p>Contenido</p></SmoothScrollProvider>)

    expect(lenis.constructor).not.toHaveBeenCalled()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })
})
