import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'
import { clearChatHistory, maxInstructionsLength, personalityOptions } from '../../settings/settings'
import { cn } from '../../utils/cn'
import { ConfirmDialog } from './ConfirmDialog'

// Asistente: personalidad y instrucciones que se envían a Groq, y borrado del historial del chat.
export function AssistantTab() {
  const { settings, update } = useSettings()
  const { notify } = useToast()
  const [confirming, setConfirming] = useState(false)

  function clearHistory() {
    clearChatHistory()
    setConfirming(false)
    notify('Historial del chat borrado')
  }

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Personalidad</h2>
        <div aria-label="Personalidad del asistente" className="grid gap-3 sm:grid-cols-2" role="radiogroup">
          {personalityOptions.map((option) => {
            const selected = settings.personality === option.value

            return (
              <button aria-checked={selected} className={cn('rounded-2xl border p-4 text-left transition', selected ? 'border-glass/40 bg-glass/10' : 'border-glass/10 bg-glass/5 hover:bg-glass/10')} key={option.value} onClick={() => update({ personality: option.value })} role="radio" type="button">
                <span className="block font-semibold text-slate-100">{option.label}</span>
                <span className="text-xs text-slate-400">{option.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col">
        <label className="settings-label" htmlFor="settings-instructions">Instrucciones personalizadas</label>
        <textarea className="settings-field settings-textarea" id="settings-instructions" maxLength={maxInstructionsLength} onChange={(event) => update({ customInstructions: event.target.value })} placeholder="Ej.: responde siempre en tercera persona y termina con una pregunta" rows={4} value={settings.customInstructions} />
        <p className="settings-hint">{settings.customInstructions.length}/{maxInstructionsLength} · Se añaden al prompt del sistema de cada conversación.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-glass/10 bg-glass/5 p-5">
        <div>
          <p className="font-semibold text-slate-100">Historial del chat</p>
          <p className="text-xs text-slate-400">Borra todas las conversaciones guardadas en este navegador.</p>
        </div>
        <button className="rounded-md border border-glass/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-glass/10" onClick={() => setConfirming(true)} type="button">Limpiar historial</button>
      </div>

      {confirming && (
        <ConfirmDialog confirmLabel="Limpiar" message="Se borrarán todas las conversaciones guardadas en este navegador. Esta acción no se puede deshacer." onCancel={() => setConfirming(false)} onConfirm={clearHistory} title="¿Limpiar el historial del chat?" />
      )}
    </section>
  )
}
