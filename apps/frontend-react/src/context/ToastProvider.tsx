import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { ToastContext, type ToastKind } from './toastContext'

interface Toast {
  id: number
  message: string
  kind: ToastKind
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
        {toasts.map((toast) => (
          <div className={`pointer-events-auto flex items-start gap-2 rounded-md border bg-slate-900/90 p-3 text-sm shadow-[0_0_24px_-6px_rgba(99,102,241,0.45)] backdrop-blur-md ${toast.kind === 'error' ? 'border-coral/40 text-coral' : 'border-emerald-500/40 text-emerald-300'}`} key={toast.id} role="status">
            {toast.kind === 'error' ? <XCircle className="mt-0.5 shrink-0" size={16} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={16} />}
            <span className="text-slate-100">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
