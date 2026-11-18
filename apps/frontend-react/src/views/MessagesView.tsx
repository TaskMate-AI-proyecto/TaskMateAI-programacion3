import { useEffect, useState, type FormEvent } from 'react'
import { RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ChannelList } from '../components/messages/ChannelList'
import { ChannelPane } from '../components/messages/ChannelPane'
import { ConversationPane } from '../components/messages/ConversationPane'
import { ContactList } from '../components/messages/ContactList'
import { useMessages } from '../hooks/useMessages'
import { useWorkspace } from '../hooks/useWorkspace'
import type { MessageContact, Workspace } from '../types/api'

// Canal activo: el espacio seleccionado, salvo en modo directo (un contacto abierto).
function channelFor(workspaces: Workspace[], selectedId: string | null, directMode: boolean) {
  if (directMode) return null

  return workspaces.find((workspace) => workspace.id === selectedId) ?? null
}

function selectedContactOf(contacts: MessageContact[], selectedId: string | null) {
  return contacts.find((contact) => contact.id === selectedId) ?? null
}

// Mensajería en un layout dividido: canales de espacios y contactos a la izquierda, y la conversación a la derecha.
export function MessagesView() {
  const { contacts, selectedId, messages, error, meId, refreshing, refresh, selectContact, send } = useMessages()
  const workspaces = useWorkspace()
  // Modo directo: se activa al abrir un contacto y dura hasta que cambie el espacio seleccionado.
  const [directFrom, setDirectFrom] = useState<{ workspaceId: string | null } | null>(null)
  const directMode = directFrom !== null && directFrom.workspaceId === workspaces.selectedId
  const activeChannel = channelFor(workspaces.workspaces, workspaces.selectedId, directMode)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [params, setParams] = useSearchParams()
  const requestedContact = params.get('contacto')
  const selected = selectedContactOf(contacts, selectedId)

  // La paleta de comandos abre una conversación con ?contacto=<id>; el parámetro se retira al usarlo.
  useEffect(() => {
    if (!requestedContact) return

    chooseContact(requestedContact)
    setParams({}, { replace: true })
  })

  function chooseChannel(workspaceId: string) {
    setDirectFrom(null)
    workspaces.select(workspaceId)
  }

  function chooseContact(userId: string) {
    setDirectFrom({ workspaceId: workspaces.selectedId })
    selectContact(userId)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !selected || sending) return

    setSending(true)
    const sentOk = await send(content)
    setSending(false)
    if (sentOk) setDraft('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Mensajes</p>
          <h1 className="font-display text-4xl font-semibold text-slate-100">Conversaciones directas.</h1>
          <p className="mt-2 max-w-lg text-slate-400">Escribe a tus amigos de TaskMate o al canal de tus espacios. La lista se actualiza sola cada pocos segundos.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-glass/20 bg-glass/5 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-xl transition hover:bg-glass/10 disabled:opacity-60" disabled={refreshing} onClick={() => void refresh()} type="button">
          <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />Actualizar
        </button>
      </div>

      <div className="glass-card grid h-[min(70vh,640px)] min-h-[480px] overflow-hidden md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col">
          <ChannelList activeId={activeChannel?.id} onSelect={chooseChannel} workspaces={workspaces.workspaces} />
          <ContactList contacts={contacts} onSelect={chooseContact} selectedId={selectedId} />
        </div>
        {activeChannel ? (
          <ChannelPane key={activeChannel.id} meId={meId} workspace={activeChannel} />
        ) : (
          <ConversationPane contact={selected} draft={draft} error={error} messages={messages} meId={meId} onDraftChange={setDraft} onSubmit={submit} sending={sending} />
        )}
      </div>
    </div>
  )
}
