import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Trophy, XCircle, Zap, type LucideIcon } from 'lucide-react'
import { ToastContext, type ToastKind } from './toastContext'

interface Toast {
  id: number
  message: string
  kind: ToastKind
}

// Estilo y icono por tipo. Los avisos de gamificación usan acentos índigo y ámbar sobre el mismo vidrio.
const toastStyles: Record<ToastKind, { className: string; Icon: LucideIcon }> = {
  success: { className: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300', Icon: CheckCircle2 },
  error: { className: 'border-coral/40 text-coral', Icon: XCircle },
  reward: { className: 'border-indigo-400/40 text-indigo-600 dark:text-indigo-300', Icon: Zap },
  achievement: { className: 'border-amber-400/50 text-amber-700 dark:text-amber-300', Icon: Trophy },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const notify = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, message, kind }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const { className, Icon } = toastStyles[toast.kind]

          return (
            <div className={`pointer-events-auto flex items-start gap-2 rounded-md border bg-slate-900/90 p-3 text-sm shadow-[0_0_24px_-6px_rgba(99,102,241,0.45)] backdrop-blur-md ${className}`} key={toast.id} role="status">
              <Icon className="mt-0.5 shrink-0" size={16} />
              <span className="text-slate-100">{toast.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext>
  )
}
