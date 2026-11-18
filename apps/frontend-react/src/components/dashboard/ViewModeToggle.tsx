import type { ViewMode } from '../../hooks/useViewMode'

const options: { value: ViewMode; label: string }[] = [
  { value: 'list', label: 'Lista' },
  { value: 'kanban', label: 'Kanban' },
]

const optionClass = 'rounded-full px-4 py-1.5 text-xs font-semibold transition'
const optionActive = 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_14px_-4px_rgba(139,92,246,0.7)]'
const optionIdle = 'text-slate-300 hover:text-slate-100'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

// Interruptor glassy [Lista | Kanban] para elegir cómo se muestran las tareas del Dashboard.
export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div aria-label="Vista de tareas" className="inline-flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl" role="group">
      {options.map((option) => {
        const selected = value === option.value

        return (
          <button
            aria-pressed={selected}
            className={`${optionClass} ${selected ? optionActive : optionIdle}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
