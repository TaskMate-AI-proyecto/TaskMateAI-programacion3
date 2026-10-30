import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useSmoothScroll } from '../../hooks/useSmoothScroll'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  const { lockScroll, unlockScroll } = useSmoothScroll()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    lockScroll()
    return unlockScroll
  }, [lockScroll, unlockScroll])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-md sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      {/* data-lenis-prevent deja que la rueda desplace el contenido del modal en lugar de la página. */}
      <div aria-label={title} aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-indigo-500/30 bg-slate-900/90 p-6 text-slate-100 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] backdrop-blur-md" data-lenis-prevent role="dialog">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button aria-label="Cerrar" className="icon-button" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
