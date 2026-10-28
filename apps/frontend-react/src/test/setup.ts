import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom no implementa matchMedia y GSAP ScrollTrigger lo usa al cargar.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// Lenis observa el tamaño del contenido y jsdom no implementa ResizeObserver.
if (typeof window.ResizeObserver !== 'function') {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

afterEach(() => {
  cleanup()
})
