import { RefreshCw, Sparkles } from 'lucide-react'

const icons = {
  regenerate: { Icon: RefreshCw, motion: 'animate-spin' },
  generate: { Icon: Sparkles, motion: 'animate-pulse' },
}

function buttonLabel(isLoading: boolean, hasSuggestions: boolean) {
  if (isLoading) return 'Generando...'

  return hasSuggestions ? 'Regenerar' : 'Desglosar con IA'
}

interface GenerateButtonProps {
  isLoading: boolean
  hasSuggestions: boolean
  onClick: () => void
}

export function GenerateButton({ isLoading, hasSuggestions, onClick }: GenerateButtonProps) {
  const { Icon, motion } = icons[hasSuggestions ? 'regenerate' : 'generate']

  return (
    <button className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-3 py-1.5 text-sm font-semibold transition hover:border-ink/40 disabled:cursor-wait disabled:opacity-60" disabled={isLoading} onClick={onClick} type="button">
      <Icon className={isLoading ? motion : ''} size={15} />
      {buttonLabel(isLoading, hasSuggestions)}
    </button>
  )
}

export function GenerationProgress({ message }: { message: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-2.5">
      <p className="text-sm text-ink/60">{message}</p>
      <div className="animate-pulse space-y-2"><div className="h-8 rounded bg-ink/10" /><div className="h-8 rounded bg-ink/10" /><div className="h-8 w-3/4 rounded bg-ink/10" /></div>
    </div>
  )
}
