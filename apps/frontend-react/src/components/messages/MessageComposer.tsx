import type { FormEvent } from 'react'
import { Send } from 'lucide-react'
import { maxMessageLength } from '../../messages/messageUtils'

interface MessageComposerProps {
  draft: string
  sending: boolean
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// Caja de entrada: un campo de vidrio y el botón de enviar.
export function MessageComposer({ draft, sending, onChange, onSubmit }: MessageComposerProps) {
  return (
    <form className="flex gap-2 border-t border-glass/10 p-4" onSubmit={onSubmit}>
      <input aria-label="Mensaje" className="settings-field min-w-0 flex-1" maxLength={maxMessageLength} onChange={(event) => onChange(event.target.value)} placeholder="Escribe un mensaje…" type="text" value={draft} />
      <button className="command-button shrink-0 disabled:opacity-60" disabled={sending || draft.trim() === ''} type="submit">
        <Send size={16} />Enviar
      </button>
    </form>
  )
}
