import { useSettings } from '../../hooks/useSettings'
import { useTheme } from '../../hooks/useTheme'
import { accentOptions } from '../../settings/settings'
import { cn } from '../../utils/cn'

const themeOptions = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
] as const

// Apariencia: acento global (variables CSS) y tema claro/oscuro con la transición de tinta desde el botón pulsado.
export function AppearanceTab() {
  const { settings, update } = useSettings()
  const { theme, select } = useTheme()

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Color de acento</h2>
        <div aria-label="Color de acento" className="flex flex-wrap gap-3" role="group">
          {accentOptions.map((option) => {
            const selected = settings.accent === option.value

            return (
              <button aria-label={option.label} aria-pressed={selected} className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition', selected ? 'border-glass/40 bg-glass/10 text-slate-100' : 'border-glass/10 text-slate-400 hover:bg-glass/5')} key={option.value} onClick={() => update({ accent: option.value })} type="button">
                <span aria-hidden className="h-4 w-4 rounded-full" style={{ backgroundColor: option.swatch }} />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Tema</h2>
        <div aria-label="Tema" className="inline-flex rounded-full border border-glass/10 bg-glass/5 p-1" role="group">
          {themeOptions.map((option) => (
            <button aria-pressed={theme === option.value} className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition', theme === option.value ? 'nav-link-active' : 'text-slate-400 hover:text-slate-100')} key={option.value} onClick={(event) => select(option.value, event)} type="button">
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">El cambio se anima con una transición de tinta desde el botón que pulsas.</p>
      </div>
    </section>
  )
}
