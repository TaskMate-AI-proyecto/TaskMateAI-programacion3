import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

// Botón de icono que alterna claro y oscuro con la transición de tinta desde el punto del clic.
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'

  return (
    <button aria-label={label} className="icon-button" onClick={(event) => toggle(event)} title={label} type="button">
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
