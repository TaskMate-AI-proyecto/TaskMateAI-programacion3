import { RefreshCw, Sparkles } from 'lucide-react'
import { getDailySummary } from '../../api/aiApi'
import { getAiErrorMessage } from '../../api/errors'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useToast } from '../../hooks/useToast'

interface SummaryBodyProps {
  isLoading: boolean
  error: string | null
  summary: string | null
}

function SummaryBody({ isLoading, error, summary }: SummaryBodyProps) {
  if (isLoading) {
    return <div className="animate-pulse space-y-2.5"><div className="h-3.5 w-full rounded bg-slate-800/70" /><div className="h-3.5 w-11/12 rounded bg-slate-800/70" /><div className="h-3.5 w-4/5 rounded bg-slate-800/70" /><p className="pt-1 text-xs text-slate-500">Consultando al asistente...</p></div>
  }

  if (error) return <p className="text-sm text-coral" role="alert">{error}</p>

  const paragraphs = (summary ?? '').split(/\n+/).filter((line) => line.trim())

  return <div className="space-y-2 text-sm leading-6 text-slate-300">{paragraphs.map((line, index) => <p key={index}>{line}</p>)}</div>
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
      <div className="mt-4"><SummaryBody error={error} isLoading={isLoading} summary={data} /></div>
    </section>
  )
}
