import { useState, type FormEvent } from 'react'
import { Check, Copy, Flame, Search, X } from 'lucide-react'
import { searchUsers } from '../../api/friendsApi'
import { getApiErrorMessage } from '../../api/errors'
import { useFriends } from '../../hooks/useFriends'
import { useToast } from '../../hooks/useToast'
import { avatarInitials } from '../../settings/settings'
import type { Friend, FriendRequest, UserSearchResult } from '../../types/api'
import { copyText } from '../../utils/clipboard'
import { Modal } from '../ui/Modal'

const relationLabels: Record<UserSearchResult['relation'], string> = {
  none: '',
  friend: 'Ya sois amigos',
  outgoing: 'Solicitud enviada',
  incoming: 'Te envió una solicitud',
}

// Botones con el mismo gesto en toda la app: crecen al pasar el cursor y se encogen al pulsar.
// Misma altura y radio que el input de búsqueda (settings-field: rounded-xl, py-2.5).
const animatedButton = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 hover:scale-105 active:scale-95 disabled:opacity-60'

// Glassy V5: el slate se invierte en tema claro, así que bg-slate-900 es claro en claro y oscuro en oscuro.
const glassyPanelClassName = 'max-w-md rounded-3xl border border-glass/20 bg-slate-900/95 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/90'

function daysLabel(days: number) {
  return days === 1 ? '1 día' : `${days} días`
}

function MyTag({ tag }: { tag?: string }) {
  const { notify } = useToast()

  async function copy() {
    if (!tag) return

    const copied = await copyText(tag)
    notify(copied ? 'Identificador copiado' : 'No se pudo copiar', copied ? 'success' : 'error')
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glass/10 bg-glass/5 p-4">
      <div>
        <p className="text-xs text-slate-400">Tu identificador</p>
        <p className="font-mono text-lg font-semibold text-slate-100">{tag ?? '…'}</p>
      </div>
      <button className={`${animatedButton} border border-glass/20 text-slate-100 hover:bg-glass/10`} disabled={!tag} onClick={() => void copy()} type="button">
        <Copy size={15} />Copiar
      </button>
    </div>
  )
}

function SearchResult({ result, onSend }: { result: UserSearchResult; onSend: (tag: string) => void }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-glass/10 bg-glass/5 px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-medium text-slate-100">{result.uniqueTag}</span>
      {result.relation === 'none' ? (
        <button className={`${animatedButton} bg-gradient-to-r from-indigo-600 to-violet-600 text-white`} onClick={() => onSend(result.uniqueTag)} type="button">
          Enviar solicitud
        </button>
      ) : (
        <span className="text-xs text-slate-400">{relationLabels[result.relation]}</span>
      )}
    </li>
  )
}

function SearchSection({ onSend }: { onSend: (tag: string) => Promise<boolean> }) {
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearching(true)
    try {
      setResults(await searchUsers(query.trim()))
    } catch (err) {
      notify(getApiErrorMessage(err, 'No se pudo buscar.'), 'error')
    } finally {
      setSearching(false)
    }
  }

  async function send(tag: string) {
    if (await onSend(tag)) {
      setResults((list) => list.map((item) => (item.uniqueTag === tag ? { ...item, relation: 'outgoing' } : item)))
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Buscar amigos</h3>
      <form className="flex gap-2" onSubmit={(event) => void search(event)}>
        <input aria-label="Identificador a buscar" className="settings-field min-w-0 flex-1" maxLength={40} onChange={(event) => setQuery(event.target.value)} placeholder="@usuario_1a2b3c" type="text" value={query} />
        <button className={`${animatedButton} bg-gradient-to-r from-indigo-600 to-violet-600 text-white`} disabled={searching || query.trim().length < 2} type="submit">
          <Search size={15} />Buscar
        </button>
      </form>
      {results.length > 0 && <ul className="space-y-2">{results.map((result) => <SearchResult key={result.id} onSend={(tag) => void send(tag)} result={result} />)}</ul>}
    </section>
  )
}

function RequestRow({ request, onRespond }: { request: FriendRequest; onRespond: (id: string, action: 'accept' | 'reject') => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-glass/10 bg-glass/5 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-100">{request.user.uniqueTag}</p>
        <p className="text-xs text-amber-700 dark:text-amber-300">Caduca en {daysLabel(request.daysLeft)}</p>
      </div>
      <button className={`${animatedButton} bg-mint text-white`} onClick={() => onRespond(request.id, 'accept')} type="button"><Check size={15} />Aceptar</button>
      <button className={`${animatedButton} border border-coral/40 text-coral`} onClick={() => onRespond(request.id, 'reject')} type="button"><X size={15} />Rechazar</button>
    </li>
  )
}

function RequestsSection({ requests, onRespond }: { requests: FriendRequest[]; onRespond: (id: string, action: 'accept' | 'reject') => void }) {
  const incoming = requests.filter((request) => request.direction === 'incoming')
  const outgoing = requests.filter((request) => request.direction === 'outgoing')

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Solicitudes recibidas</h3>
      {incoming.length === 0 ? (
        <p className="text-sm text-slate-400">No tienes solicitudes pendientes.</p>
      ) : (
        <ul className="space-y-2">{incoming.map((request) => <RequestRow key={request.id} onRespond={onRespond} request={request} />)}</ul>
      )}
      {outgoing.map((request) => (
        <p className="text-xs text-slate-400" key={request.id}>Enviada a {request.user.uniqueTag} · caduca en {daysLabel(request.daysLeft)}</p>
      ))}
    </section>
  )
}

// Nivel y racha del amigo junto a su identificador. Si la API no los envía, no se muestran.
function FriendBadges({ level, currentStreak }: { level?: number; currentStreak?: number }) {
  if (level === undefined) return null

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
      <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-600 dark:text-indigo-300">Nvl {level}</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-coral/30 bg-coral/10 px-2 py-0.5 text-coral">
        <Flame size={12} />{currentStreak ?? 0}
      </span>
    </span>
  )
}

function FriendList({ friends }: { friends: Friend[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Tus amigos ({friends.length})</h3>
      {friends.length === 0 ? (
        <p className="text-sm text-slate-400">Aún no tienes amigos. Busca a alguien por su identificador.</p>
      ) : (
        <ul className="space-y-2">
          {friends.map((item) => (
            <li className="flex items-center gap-3" key={item.friendshipId}>
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">{avatarInitials('', item.friend.email)}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{item.friend.uniqueTag}</span>
              <FriendBadges currentStreak={item.friend.currentStreak} level={item.friend.level} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Amigos: tu identificador para compartirlo, búsqueda para enviar solicitudes y la gestión de las recibidas.
export function FriendsModal({ onClose }: { onClose: () => void }) {
  const { me, friends, requests, error, send, respond } = useFriends()

  return (
    <Modal onClose={onClose} panelClassName={glassyPanelClassName} title="Amigos">
      <div className="space-y-6">
        <MyTag tag={me?.uniqueTag} />
        <SearchSection onSend={send} />
        {error && <p aria-live="polite" className="text-sm text-coral">{error}</p>}
        <RequestsSection onRespond={(id, action) => void respond(id, action)} requests={requests} />
        <FriendList friends={friends} />
      </div>
    </Modal>
  )
}
