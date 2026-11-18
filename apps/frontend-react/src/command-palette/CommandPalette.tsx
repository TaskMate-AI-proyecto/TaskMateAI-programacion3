import { Search } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { getFriends } from '../api/friendsApi'
import { getTasks, toggleTaskStatus } from '../api/tasksApi'
import { useSafeAction } from '../hooks/useSafeAction'
import { useTaskSync } from '../hooks/useTaskSync'
import { useToast } from '../hooks/useToast'
import type { Friend, Task } from '../types/api'
import { cn } from '../utils/cn'
import { flattenGroups, moveActiveIndex, searchCommands, type CommandGroup } from './commandSearch'
import { friendEntries, taskEntries, workspaceEntries, type PaletteEntry } from './paletteEntries'
import { useWorkspace } from '../hooks/useWorkspace'

const listId = 'command-palette-list'

function optionId(index: number) {
  return `command-option-${index}`
}

function arrowStep(key: string): 1 | -1 | 0 {
  if (key === 'ArrowDown') return 1
  if (key === 'ArrowUp') return -1

  return 0
}

// Tareas y amigos se piden al abrir la paleta: siempre reflejan el estado actual.
function useLiveData() {
  const [data, setData] = useState<{ tasks: Task[]; friends: Friend[] } | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([getTasks().catch(() => [] as Task[]), getFriends().catch(() => [] as Friend[])]).then(([tasks, friends]) => {
      if (active) setData({ tasks, friends })
    })

    return () => {
      active = false
    }
  }, [])

  return data
}

function ShortcutKeys({ shortcut }: { shortcut: string }) {
  return (
    <span className="flex shrink-0 gap-1">
      {shortcut.split(' ').map((key) => (
        <kbd className="rounded border border-glass/15 px-1.5 py-0.5 font-mono text-[11px] text-slate-400" key={key}>{key}</kbd>
      ))}
    </span>
  )
}

interface PaletteOptionProps {
  item: PaletteEntry
  index: number
  active: boolean
  onHover: (index: number) => void
  onRun: (entry: PaletteEntry) => void
}

function PaletteOption({ item, index, active, onHover, onRun }: PaletteOptionProps) {
  return (
    <div
      aria-selected={active}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
        active ? 'bg-indigo-500/20 text-slate-100 ring-1 ring-indigo-400/40' : 'text-slate-300 hover:bg-glass/5',
      )}
      id={optionId(index)}
      onClick={() => onRun(item)}
      // Mantiene el foco en el campo de búsqueda al hacer clic en una opción.
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => onHover(index)}
      role="option"
    >
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.hint && <span className="shrink-0 text-xs text-slate-400">{item.hint}</span>}
      {item.shortcut && <ShortcutKeys shortcut={item.shortcut} />}
    </div>
  )
}

interface PaletteOptionsProps {
  groups: CommandGroup<PaletteEntry>[]
  active: number
  query: string
  onHover: (index: number) => void
  onRun: (entry: PaletteEntry) => void
}

function PaletteOptions({ groups, active, query, onHover, onRun }: PaletteOptionsProps) {
  const flat = flattenGroups(groups)

  if (groups.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-slate-400">Sin resultados para «{query}»</p>
  }

  return (
    <>
      {groups.map((group) => (
        <div aria-label={group.category} key={group.category} role="group">
          <p aria-hidden className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.category}</p>
          {group.items.map((item) => {
            const index = flat.indexOf(item)

            return <PaletteOption active={index === active} index={index} item={item} key={item.id} onHover={onHover} onRun={onRun} />
          })}
        </div>
      ))}
    </>
  )
}

function PaletteFooter({ loading }: { loading: boolean }) {
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-glass/10 px-4 py-2 text-xs text-slate-500">
      <span>{loading ? 'Cargando tareas y amigos…' : ''}</span>
      <span>↑↓ navegar · ↵ abrir · Esc cerrar</span>
    </footer>
  )
}

interface CommandPaletteProps {
  entries: PaletteEntry[]
  onClose: () => void
}

// Paleta de comandos: modal con portal, búsqueda agrupada y navegación con el teclado.
export function CommandPalette({ entries, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { notifyTasksChanged } = useTaskSync()
  const { notify } = useToast()
  const runSafely = useSafeAction()
  const data = useLiveData()
  const workspaceState = useWorkspace()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function completeTask(task: Task) {
    const result = await runSafely(() => toggleTaskStatus(task))
    if (!result.ok) return

    notifyTasksChanged()
    notify(task.status === 'COMPLETED' ? 'Tarea reabierta' : 'Tarea completada')
  }

  const liveEntries = data
    ? [
        ...taskEntries(data.tasks, { open: (task) => navigate(`/tasks?tarea=${task.id}`), toggle: (task) => void completeTask(task) }),
        ...friendEntries(data.friends, (friendId) => navigate(`/messages?contacto=${friendId}`)),
      ]
    : []

  const spaceEntries = workspaceState ? workspaceEntries(workspaceState.workspaces, workspaceState.select) : []
  const groups = searchCommands([...entries, ...liveEntries, ...spaceEntries], query)
  const flat = flattenGroups(groups)
  const active = flat.length === 0 ? -1 : Math.min(activeIndex, flat.length - 1)
  const activeDescendant = active >= 0 ? optionId(active) : undefined

  // Al ejecutar un comando la paleta se cierra primero; después corre la acción.
  function runEntry(entry: PaletteEntry) {
    onClose()
    entry.run()
  }

  useEffect(() => {
    const previous = document.activeElement
    inputRef.current?.focus()

    return () => {
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  useEffect(() => {
    if (active >= 0) document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' })
  }, [active])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const entry = flat[active]
      if (entry) runEntry(entry)
      return
    }

    const step = arrowStep(event.key)
    if (step !== 0) {
      event.preventDefault()
      setActiveIndex(moveActiveIndex(active, flat.length, step))
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setActiveIndex(0)
  }

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]" onMouseDown={handleOverlayMouseDown}>
      <div aria-label="Paleta de comandos" aria-modal="true" className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden" role="dialog">
        <div className="flex items-center gap-3 border-b border-glass/10 px-4">
          <Search aria-hidden className="shrink-0 text-slate-400" size={18} />
          <input
            aria-activedescendant={activeDescendant}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded="true"
            aria-label="Buscar comandos, tareas o amigos"
            autoComplete="off"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar comandos, tareas o amigos…"
            ref={inputRef}
            role="combobox"
            spellCheck={false}
            type="text"
            value={query}
          />
          <kbd className="hidden rounded border border-glass/15 px-1.5 py-0.5 font-mono text-[11px] text-slate-400 sm:inline">Esc</kbd>
        </div>

        <div aria-label="Resultados" className="max-h-[50vh] overflow-y-auto p-2" id={listId} role="listbox">
          <PaletteOptions active={active} groups={groups} onHover={setActiveIndex} onRun={runEntry} query={query} />
        </div>

        <PaletteFooter loading={data === null} />
      </div>
    </div>,
    document.body,
  )
}
