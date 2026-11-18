import type { Workspace } from '../../types/api'
import { cn } from '../../utils/cn'

interface ChannelListProps {
  workspaces: Workspace[]
  activeId?: string
  onSelect: (id: string) => void
}

// Canales grupales: uno por espacio del usuario. Elegir uno lo activa también en la barra lateral.
export function ChannelList({ workspaces, activeId, onSelect }: ChannelListProps) {
  if (workspaces.length === 0) return null

  return (
    <section aria-label="Canales de espacios" className="border-b border-glass/10 p-3">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Espacios</p>
      <ul className="space-y-1">
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <button
              aria-pressed={workspace.id === activeId}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
                workspace.id === activeId ? 'bg-indigo-500/15 text-slate-100' : 'text-slate-400 hover:bg-glass/5 hover:text-slate-100',
              )}
              onClick={() => onSelect(workspace.id)}
              type="button"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: workspace.color }} />
              <span className="truncate">{workspace.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
