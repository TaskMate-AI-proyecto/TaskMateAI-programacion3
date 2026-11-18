import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FriendsModal } from '../components/friends/FriendsModal'
import { ProductivityReportModal } from '../components/reports/ProductivityReportModal'
import { CommandPaletteContext, type CommandPaletteContextValue } from '../context/commandPaletteContext'
import { useProductivityReport } from '../hooks/useProductivityReport'
import { useTheme } from '../hooks/useTheme'
import { requestViewMode } from '../hooks/useViewMode'
import { CommandPalette } from './CommandPalette'
import { staticEntries, type PaletteEntry } from './paletteEntries'
import { hasModifier, hasOpenDialog, isEditableTarget, isPaletteShortcut, resolveKey } from './shortcuts'

// Las letras sueltas no son atajos al escribir, con otra tecla pulsada o con otro diálogo abierto.
function isIgnoredKey(event: KeyboardEvent) {
  return event.repeat || isEditableTarget(event.target) || hasModifier(event) || hasOpenDialog()
}

// Dueño de la paleta: el atajo global, el estado de apertura y los modales que sus comandos abren.
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { toggle: toggleTheme } = useTheme()
  const report = useProductivityReport()
  const [isOpen, setIsOpen] = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)

  const entries = staticEntries({
    go: (path) => navigate(path),
    openKanban: () => {
      requestViewMode('kanban')
      navigate('/dashboard')
    },
    openFriends: () => setFriendsOpen(true),
    newTask: () => navigate('/tasks?nueva=1'),
    toggleTheme: () => toggleTheme(),
    exportReport: () => report.open(),
  })

  // El listener se registra una sola vez y lee siempre la lista más reciente.
  const entriesRef = useRef<PaletteEntry[]>(entries)
  useEffect(() => {
    entriesRef.current = entries
  })

  useEffect(() => {
    let armedAt: number | null = null

    function handleKeyDown(event: KeyboardEvent) {
      if (isPaletteShortcut(event)) {
        event.preventDefault()
        setIsOpen((current) => !current)
        return
      }
      if (isIgnoredKey(event)) return

      const step = resolveKey(armedAt, event.key, Date.now())
      armedAt = step.armedAt
      const entry = entriesRef.current.find((item) => item.id === step.commandId)

      if (entry) {
        event.preventDefault()
        entry.run()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ open: () => setIsOpen(true), close: () => setIsOpen(false) }),
    [],
  )

  return (
    <CommandPaletteContext value={value}>
      {children}
      {isOpen && <CommandPalette entries={entries} onClose={value.close} />}
      {friendsOpen && <FriendsModal onClose={() => setFriendsOpen(false)} />}
      {report.isOpen && <ProductivityReportModal report={report} />}
    </CommandPaletteContext>
  )
}
