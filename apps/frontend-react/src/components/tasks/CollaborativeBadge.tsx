import type { AssignedUser } from '../../types/api'
import { avatarInitials } from '../../settings/settings'

// Badge "Colaborativa" con los avatares de los amigos con los que se comparte la tarea.
export function CollaborativeBadge({ users }: { users?: AssignedUser[] }) {
  if (!users || users.length === 0) return null

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 py-0.5 pl-1 pr-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-200">
      <span className="flex -space-x-2">
        {users.map((user) => (
          <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full border border-white/40 bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] text-white" key={user.id}>
            {avatarInitials('', user.email)}
          </span>
        ))}
      </span>
      Colaborativa
    </span>
  )
}
