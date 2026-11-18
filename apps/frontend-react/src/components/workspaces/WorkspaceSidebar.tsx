import { ChevronDown, ChevronRight, Layers, Plus } from 'lucide-react'
import { useState } from 'react'
import { useWorkspace } from '../../hooks/useWorkspace'
import { cn } from '../../utils/cn'
import { WorkspaceModal } from './WorkspaceModal'

function SpaceChip({ label, color, active, onClick }: { label: string; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        'w-full px-2 py-1 rounded-full flex items-center justify-center gap-1 overflow-hidden border text-xs font-semibold transition',
        active ? 'border-indigo-400/60 bg-indigo-500/15 text-slate-100' : 'border-glass/10 bg-glass/5 text-slate-400 hover:text-slate-100',
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  )
}

// Sección colapsable "Espacios" de la cápsula lateral: "Todos" o un espacio concreto, y el botón + para crear.
export function WorkspaceSidebar() {
  const workspaces = useWorkspace()
  const [expanded, setExpanded] = useState(true)
  const [creating, setCreating] = useState(false)

  const Chevron = expanded ? ChevronDown : ChevronRight

  return (
      <section aria-label="Espacios" className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full items-center justify-between px-1">
        <button aria-expanded={expanded} aria-label="Espacios" className="nav-icon !h-5 !w-5 shrink-0" onClick={() => setExpanded((value) => !value)} title="Espacios" type="button">
          <Layers size={18} />
        </button>
        <Chevron aria-hidden className="shrink-0 text-slate-500" size={14} />
        <button aria-label="Nuevo espacio" className="nav-icon !h-5 !w-5 shrink-0" onClick={() => setCreating(true)} title="Nuevo espacio" type="button">
          <Plus size={18} />
        </button>
      </div>
      {expanded && (
        <ul className="mx-auto flex w-full flex-col items-center gap-1.5 overflow-hidden">
          <li className="w-full"><SpaceChip active={workspaces.selectedId === null} label="Todos" onClick={() => workspaces.select(null)} /></li>
          {workspaces.workspaces.map((workspace) => (
            <li className="w-full" key={workspace.id}>
              <SpaceChip active={workspaces.selectedId === workspace.id} color={workspace.color} label={workspace.name} onClick={() => workspaces.select(workspace.id)} />
            </li>
          ))}
        </ul>
      )}
      {creating && <WorkspaceModal onClose={() => setCreating(false)} />}
    </section>
  )
}
