import { useFriends } from '../../hooks/useFriends'
import { avatarInitials } from '../../settings/settings'
import { cn } from '../../utils/cn'

interface CollaboratorPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

// Selector de amigos colaboradores: cada amigo es una pastilla que se activa o desactiva.
export function CollaboratorPicker({ selectedIds, onChange }: CollaboratorPickerProps) {
  const { friends } = useFriends()

  function toggle(userId: string) {
    onChange(selectedIds.includes(userId) ? selectedIds.filter((id) => id !== userId) : [...selectedIds, userId])
  }

  if (friends.length === 0) return <p className="text-xs text-slate-500">Aún no tienes amigos para compartir esta tarea.</p>

  return (
    <div aria-label="Agregar amigo o colaborador" className="flex flex-wrap gap-2" role="group">
      {friends.map(({ friend }) => {
        const selected = selectedIds.includes(friend.id)

        return (
          <button aria-pressed={selected} className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition', selected ? 'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white' : 'border-glass/20 bg-glass/5 text-slate-300 hover:bg-glass/10')} key={friend.id} onClick={() => toggle(friend.id)} type="button">
            <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[9px]">{avatarInitials('', friend.email)}</span>
            {friend.uniqueTag}
          </button>
        )
      })}
    </div>
  )
}
