import { useEffect, useRef, type FormEvent } from 'react'
import { isMine, timeLabel } from '../../messages/messageUtils'
import { avatarInitials } from '../../settings/settings'
import type { DirectMessage, MessageContact } from '../../types/api'
import { cn } from '../../utils/cn'
import { MessageComposer } from './MessageComposer'

interface ConversationPaneProps {
  contact: MessageContact | null
  messages: DirectMessage[]
  meId: string
  error: string | null
  draft: string
  sending: boolean
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function MessageBubble({ message, mine }: { message: DirectMessage; mine: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%] rounded-2xl border px-4 py-2.5 text-sm', mine ? 'border-indigo-400/30 bg-indigo-500/25 text-indigo-950 dark:text-indigo-50' : 'border-glass/10 bg-glass/5 text-slate-100')}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className="mt-1 text-right text-[11px] text-slate-500">{timeLabel(message.createdAt)}{mine && message.readAt ? ' · Leído' : ''}</p>
      </div>
    </div>
  )
}

// Panel central: cabecera del contacto, historial con scroll automático al último mensaje y la caja de entrada.
export function ConversationPane({ contact, messages, meId, error, draft, sending, onDraftChange, onSubmit }: ConversationPaneProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const contactId = contact?.id

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages.length, contactId])

  if (!contact) {
    return <section className="grid place-items-center p-8 text-center text-sm text-slate-400">Selecciona un contacto para empezar a escribir.</section>
  }

  return (
    <section aria-label={`Conversación con ${contact.email}`} className="flex min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-glass/10 p-4">
        <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">{avatarInitials('', contact.email)}</span>
        <p className="truncate font-semibold text-slate-100">{contact.email}</p>
      </header>
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">Aún no hay mensajes. Escribe el primero.</p>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} mine={isMine(message, meId)} />)
        )}
      </div>
      {error && <p aria-live="polite" className="px-5 pb-2 text-sm text-coral">{error}</p>}
      <MessageComposer draft={draft} onChange={onDraftChange} onSubmit={onSubmit} sending={sending} />
    </section>
  )
}
