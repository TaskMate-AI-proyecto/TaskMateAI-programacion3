import { Plus, Search } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ChatThread } from '../../hooks/useChatThreads'

interface ChatThreadListProps {
  threads: ChatThread[]
  activeId: string | null
  search: string
  onSearch: (value: string) => void
  onSelect: (id: string) => void
  onNew: () => void
}

function threadStatus(thread: ChatThread) {
  const count = thread.messages.length

  if (count === 0) return 'Sin mensajes'
  const last = thread.messages[count - 1]

  return last.role === 'user' ? `${count} mensajes · esperando respuesta` : `${count} mensajes · respondido`
}

// Panel izquierdo: historial de hilos con la IA, búsqueda y estado de cada conversación.
export function ChatThreadList({ threads, activeId, search, onSearch, onSelect, onNew }: ChatThreadListProps) {
  return (
    <aside aria-label="Historial de conversaciones" className="glass-card flex min-h-[32rem] flex-col gap-4 p-4">
      <button className="command-button w-full justify-center" onClick={onNew} type="button"><Plus size={16} />Nueva conversación</button>
      <label className="relative block">
        <span className="sr-only">Buscar conversaciones</span>
        <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          aria-label="Buscar conversaciones"
          className="w-full rounded-full border border-white/10 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-indigo-400"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Buscar en el historial"
          type="search"
          value={search}
        />
      </label>
      <ul className="flex flex-col gap-2 overflow-y-auto">
        {threads.map((thread) => {
          const isActive = thread.id === activeId

          return (
            <li key={thread.id}>
              <button
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'w-full rounded-2xl border px-3 py-2.5 text-left transition',
                  isActive ? 'border-indigo-400/40 bg-white/10' : 'border-transparent hover:bg-white/5',
                )}
                onClick={() => onSelect(thread.id)}
                type="button"
              >
                <span className="block truncate text-sm font-medium text-slate-100">{thread.title}</span>
                <span className="block text-xs text-slate-500">{threadStatus(thread)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {threads.length === 0 && <p className="text-sm text-slate-500">No hay conversaciones que coincidan.</p>}
    </aside>
  )
}
