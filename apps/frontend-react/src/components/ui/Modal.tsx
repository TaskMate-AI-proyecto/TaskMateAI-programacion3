import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useSmoothScroll } from '../../hooks/useSmoothScroll'
import { cn } from '../../utils/cn'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  // Acabado del panel. Por defecto, el de los modales de la app; cada modal puede pasar el suyo.
  panelClassName?: string
  overlayClassName?: string
}

const defaultPanelClassName = 'max-w-lg rounded-md border border-indigo-500/30 bg-slate-900/90 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] backdrop-blur-md'

// Se monta en <body> con un portal: así no queda recortado por ancestros con backdrop-filter (p. ej. la barra en píldora).
export function Modal({ title, onClose, children, panelClassName = defaultPanelClassName, overlayClassName }: ModalProps) {
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

  return createPortal(
    <div className={cn('fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center', overlayClassName)} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      {/* data-lenis-prevent deja que la rueda desplace el contenido del modal en lugar de la página. */}
      <div aria-label={title} aria-modal="true" className={cn('max-h-[90vh] w-full overflow-y-auto p-6 text-slate-100', panelClassName)} data-lenis-prevent role="dialog">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <button aria-label="Cerrar" className="icon-button" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
