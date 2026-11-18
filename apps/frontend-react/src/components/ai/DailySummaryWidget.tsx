import { RefreshCw, Sparkles, TriangleAlert } from 'lucide-react'
import { getDailySummary } from '../../api/aiApi'
import { getAiErrorMessage } from '../../api/errors'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useToast } from '../../hooks/useToast'
import { AiText } from '../chat/AiText'

interface SummaryBodyProps {
  isLoading: boolean
  error: string | null
  summary: string | null
  onRetry: () => void
}

function SummaryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300" role="alert">
      <TriangleAlert aria-hidden className="shrink-0" size={18} />
      <p className="min-w-0 flex-1">{message}</p>
      <button className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 font-semibold transition duration-200 hover:bg-amber-500/10 active:scale-95" onClick={onRetry} type="button">
        <RefreshCw size={14} />Reintentar
      </button>
    </div>
  )
}

function SummaryBody({ isLoading, error, summary, onRetry }: SummaryBodyProps) {
  if (isLoading) {
    return <div className="animate-pulse space-y-2.5"><div className="h-3.5 w-full rounded bg-slate-800/70" /><div className="h-3.5 w-11/12 rounded bg-slate-800/70" /><div className="h-3.5 w-4/5 rounded bg-slate-800/70" /><p className="pt-1 text-xs text-slate-500">Consultando al asistente...</p></div>
  }

  if (error) return <SummaryError message={error} onRetry={onRetry} />

  return <AiText className="text-sm leading-6 text-slate-300" text={summary ?? ''} />
}

export function DailySummaryWidget() {
  const { notify } = useToast()
  const { data, error, isLoading, reload } = useAsyncData(getDailySummary, 'summary', {
    describeError: getAiErrorMessage,
    onError: (message) => notify(message, 'error'),
  })

  return (
    <section aria-busy={isLoading} className="glass-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Sparkles className="text-coral" size={20} /><h2 className="font-display text-2xl font-semibold">Resumen del día</h2></div>
        <button aria-label="Actualizar resumen" className="icon-button" disabled={isLoading} onClick={reload} title="Actualizar resumen" type="button"><RefreshCw className={isLoading ? 'animate-spin' : ''} size={18} /></button>
      </div>
      <div className="mt-4"><SummaryBody error={error} isLoading={isLoading} onRetry={reload} summary={data} /></div>
    </section>
  )
}
