import { useState, type FormEvent } from 'react'
import { useGroupChannel } from '../../hooks/useGroupChannel'
import { timeLabel } from '../../messages/messageUtils'
import type { DirectMessage, Workspace } from '../../types/api'
import { cn } from '../../utils/cn'

function SenderName({ message }: { message: DirectMessage }) {
  return <p className="mb-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">{message.sender?.uniqueTag ?? 'Miembro'}</p>
}

function GroupBubble({ message, mine }: { message: DirectMessage; mine: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%] rounded-2xl border px-4 py-2.5 text-sm', mine ? 'border-indigo-400/30 bg-indigo-500/25 text-indigo-950 dark:text-indigo-50' : 'border-glass/10 bg-glass/5 text-slate-100')}>
        {!mine && <SenderName message={message} />}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className="mt-1 text-right text-[11px] text-slate-500">{timeLabel(message.createdAt)}</p>
      </div>
    </div>
  )
}

// Canal grupal exclusivo de un espacio: historial compartido por sus miembros y caja de entrada.
export function ChannelPane({ workspace, meId }: { workspace: Workspace; meId: string }) {
  const { messages, error, send } = useGroupChannel(workspace.id)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    setSending(true)
    const sentOk = await send(content)
    setSending(false)
    if (sentOk) setDraft('')
  }

  return (
    <section aria-label={`Canal de ${workspace.name}`} className="flex min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-glass/10 px-5 py-4">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: workspace.color }} />
        <div>
          <p className="font-semibold text-slate-100">{workspace.name}</p>
          <p className="text-xs text-slate-400">Canal del espacio · {workspace.memberCount} miembros</p>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {error && <p className="text-sm text-coral" role="alert">{error}</p>}
        {messages.length === 0 && <p className="text-sm text-slate-400">Todavía no hay mensajes en este espacio.</p>}
        {messages.map((message) => <GroupBubble key={message.id} mine={message.senderId === meId} message={message} />)}
      </div>
      <form className="flex gap-2 border-t border-glass/10 p-4" onSubmit={(event) => void submit(event)}>
        <input aria-label="Mensaje al espacio" className="settings-field min-w-0 flex-1" maxLength={2000} onChange={(event) => setDraft(event.target.value)} placeholder={`Escribe a ${workspace.name}…`} type="text" value={draft} />
        <button className="command-button" disabled={sending || !draft.trim()} type="submit">Enviar</button>
      </form>
    </section>
  )
}
