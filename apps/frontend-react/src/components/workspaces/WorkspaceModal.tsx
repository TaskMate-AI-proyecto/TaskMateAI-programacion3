import { useState, type FormEvent } from 'react'
import { getFriends } from '../../api/friendsApi'
import { getApiErrorMessage } from '../../api/errors'
import { addWorkspaceMembers, createWorkspace } from '../../api/workspacesApi'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useSafeAction } from '../../hooks/useSafeAction'
import { useToast } from '../../hooks/useToast'
import { useWorkspace } from '../../hooks/useWorkspace'
import type { Friend, Workspace } from '../../types/api'
import { Modal } from '../ui/Modal'

const workspaceColors = ['#6366F1', '#EF6F5E', '#4B9B84', '#F59E0B', '#EC4899']

// Glassy V5 del modal de espacios: vidrio claro en tema claro y oscuro translúcido en tema oscuro.
const workspacePanel = 'w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-6 text-slate-800 shadow-2xl backdrop-blur-2xl [&>div>h2]:font-bold [&>div>h2]:text-xl [&>div>h2]:!text-slate-900 dark:border-white/15 dark:bg-slate-900/95 dark:text-slate-100 dark:[&>div>h2]:!text-white'
const workspaceOverlay = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm'

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

function FriendPicker({ friends, selected, onToggle }: { friends: Friend[]; selected: string[]; onToggle: (id: string) => void }) {
  if (friends.length === 0) return <p className="text-sm text-slate-600 dark:text-slate-400">No hay amigos para invitar.</p>

  return (
    <ul className="max-h-40 space-y-1.5 overflow-y-auto">
      {friends.map((item) => (
        <li key={item.friend.id}>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 !text-slate-900 text-sm font-medium transition hover:bg-slate-200/60 dark:!text-slate-100 dark:hover:bg-white/10">
            <input checked={selected.includes(item.friend.id)} className="accent-indigo-500" onChange={() => onToggle(item.friend.id)} type="checkbox" />
            {item.friend.uniqueTag}
          </label>
        </li>
      ))}
    </ul>
  )
}

function CreateSection({ friends, onCreated }: { friends: Friend[]; onCreated: () => void }) {
  const workspaces = useWorkspace()
  const runSafely = useSafeAction()
  const { notify } = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState(workspaceColors[0])
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Crea el espacio, lo selecciona y cierra el modal. Los errores de la API los muestra runSafely.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || saving) return

    setSaving(true)
    const result = await runSafely(() => createWorkspace({ name: name.trim(), color, memberIds }))
    setSaving(false)
    if (!result.ok) return

    notify('Espacio creado')
    await workspaces.reload()
    workspaces.select(result.value.id)
    onCreated()
  }

  return (
    <form className="space-y-3" onSubmit={(event) => void submit(event)}>
      <h3 className="!text-slate-700 dark:!text-slate-200 text-xs font-semibold">Nuevo espacio</h3>
      <input aria-label="Nombre del espacio" className="settings-field" maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Proyecto final" type="text" value={name} />
      <div className="flex items-center gap-2" role="group" aria-label="Color del espacio">
        {workspaceColors.map((item) => (
          <button aria-label={`Color ${item}`} aria-pressed={color === item} className={`h-7 w-7 rounded-full border-2 transition ${color === item ? 'scale-110 border-white ring-2 ring-slate-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-slate-900' : 'border-transparent'}`} key={item} onClick={() => setColor(item)} style={{ backgroundColor: item }} type="button" />
        ))}
      </div>
      <p className="!text-slate-700 dark:!text-slate-200 text-xs font-semibold">Invita amigos (opcional)</p>
      <FriendPicker friends={friends} onToggle={(id) => setMemberIds((list) => toggleId(list, id))} selected={memberIds} />
      <button className="command-button w-full justify-center" disabled={saving || !name.trim()} type="submit">Crear espacio</button>
    </form>
  )
}

// Añade a un espacio los amigos que todavía no son miembros.
function MemberManager({ workspace, friends }: { workspace: Workspace; friends: Friend[] }) {
  const runSafely = useSafeAction()
  const workspaces = useWorkspace()
  const { notify } = useToast()
  const [picked, setPicked] = useState<string[]>([])
  const memberIds = workspace.members.map((member) => member.id)
  const candidates = friends.filter((item) => !memberIds.includes(item.friend.id))

  async function addMembers() {
    if (picked.length === 0) return

    const result = await runSafely(() => addWorkspaceMembers(workspace.id, picked))
    if (!result.ok) return

    setPicked([])
    notify(`Añadidos ${result.value.added} amigos`)
    await workspaces.reload()
  }

  return (
    <div className="space-y-3">
      <FriendPicker friends={candidates} onToggle={(id) => setPicked((list) => toggleId(list, id))} selected={picked} />
      <button className="command-button w-full justify-center" disabled={picked.length === 0} onClick={() => void addMembers()} type="button">Añadir amigos</button>
    </div>
  )
}

function ManageSection({ workspaces, friends }: { workspaces: Workspace[]; friends: Friend[] }) {
  const [managedId, setManagedId] = useState<string | null>(null)
  const managed = workspaces.find((workspace) => workspace.id === managedId) ?? workspaces[0]

  return (
    <section className="mt-4 space-y-3 border-t border-slate-200/80 pt-4 dark:border-white/10">
      <h3 className="!text-slate-700 dark:!text-slate-200 text-xs font-semibold">Gestionar espacio</h3>
      <select aria-label="Espacio a gestionar" className="settings-field !bg-slate-100 !text-slate-900 dark:!bg-slate-800 dark:!text-white" onChange={(event) => setManagedId(event.target.value)} value={managed.id}>
        {workspaces.map((workspace) => <option className="!bg-slate-100 !text-slate-900 dark:!bg-slate-800 dark:!text-white" key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
      </select>
      <MemberManager friends={friends} key={managed.id} workspace={managed} />
    </section>
  )
}

// Crear un espacio con amigos y gestionar los existentes. Sólo se abre desde la cápsula lateral.
export function WorkspaceModal({ onClose }: { onClose: () => void }) {
  const workspaces = useWorkspace()
  const { data, error } = useAsyncData(getFriends, 'workspace-friends', {
    describeError: (requestError) => getApiErrorMessage(requestError, 'No se pudieron cargar tus amigos.'),
  })
  const friends = data ?? []

  return (
    <Modal onClose={onClose} overlayClassName={workspaceOverlay} panelClassName={workspacePanel} title="Espacios">
      <div className="space-y-6">
        {error && <p className="text-sm text-coral" role="alert">{error}</p>}
        <CreateSection friends={friends} onCreated={onClose} />
        {workspaces.workspaces.length > 0 && <ManageSection friends={friends} workspaces={workspaces.workspaces} />}
      </div>
    </Modal>
  )
}
