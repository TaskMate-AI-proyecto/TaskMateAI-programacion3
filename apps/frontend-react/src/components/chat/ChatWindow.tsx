import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Sparkles } from 'lucide-react'
import type { ChatThread } from '../../hooks/useChatThreads'
import { ChatBubble } from './ChatBubble'

const quickPrompts = [
  { label: 'Dividir tarea en pasos', prompt: 'Divide mi tarea más urgente en pasos concretos.' },
  { label: 'Resumir pendientes', prompt: 'Resume mis tareas pendientes.' },
]

function ChatHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-white/10 pb-4">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_20px_-4px_rgba(139,92,246,0.8)]">
        <Bot size={20} />
      </span>
      <div>
        <p className="font-semibold text-slate-100">TaskMate AI</p>
        <p className="flex items-center gap-1.5 text-xs text-emerald-300">
          <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-400" />
          Online
        </p>
      </div>
    </header>
  )
}

function MessageList({ thread, isSending }: { thread: ChatThread | null; isSending: boolean }) {
  if (!thread || thread.messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
        <Sparkles aria-hidden size={24} />
        <p>Pregúntame por tus tareas: puedo dividirlas en pasos o resumir lo pendiente.</p>
      </div>
    )
  }

  return (
    <>
      <ol aria-label="Mensajes" className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {thread.messages.map((message) => <ChatBubble key={message.id} message={message} />)}
      </ol>
      {isSending && <p className="text-xs text-slate-400" role="status">TaskMate AI está escribiendo…</p>}
    </>
  )
}

function SuggestionChips({ disabled, onPick }: { disabled: boolean; onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {quickPrompts.map(({ label, prompt }) => (
        <button
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xl transition hover:border-indigo-400/50 hover:bg-white/10 disabled:opacity-50"
          disabled={disabled}
          key={label}
          onClick={() => onPick(prompt)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

interface ChatComposerProps {
  disabled: boolean
  onSend: (text: string) => void
}

// Campo de entrada con botón de envío animado. Se limpia sólo cuando el mensaje se envía.
function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const canSend = !disabled && draft.trim().length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSend) return

    onSend(draft)
    setDraft('')
  }

  return (
    <form className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 p-1.5 pl-4 backdrop-blur-xl" onSubmit={handleSubmit}>
      <input
        aria-label="Mensaje para TaskMate AI"
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Escribe un mensaje…"
        value={draft}
      />
      <motion.button
        aria-label="Enviar mensaje"
        className="command-button h-10 w-10 justify-center rounded-full p-0 disabled:opacity-50"
        disabled={!canSend}
        type="submit"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <Send size={16} />
      </motion.button>
    </form>
  )
}

interface ChatWindowProps {
  thread: ChatThread | null
  isSending: boolean
  onSend: (text: string) => void
}

// Panel central: cabecera con estado, burbujas, sugerencias y el campo de entrada.
export function ChatWindow({ thread, isSending, onSend }: ChatWindowProps) {
  return (
    <section aria-label="Conversación con TaskMate AI" className="glass-card flex min-h-[32rem] flex-col gap-4 p-5">
      <ChatHeader />
      <MessageList isSending={isSending} thread={thread} />
      <SuggestionChips disabled={isSending} onPick={onSend} />
      <ChatComposer disabled={isSending} onSend={onSend} />
    </section>
  )
}
