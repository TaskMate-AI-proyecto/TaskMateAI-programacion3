import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'

const tabs = [
  { label: 'Resumen', to: '/dashboard' },
  { label: 'Tareas', to: '/tasks' },
  { label: 'Chat IA', to: '/chat' },
]

interface TopPillProps {
  email: string | null
  onLogout: () => void
}

// Barra superior en píldora: marca, pestañas con brillo en la activa y la sesión.
export function TopPill({ email, onLogout }: TopPillProps) {
  return (
    <header className="glass-pill flex flex-wrap items-center justify-between gap-3 py-2 pl-6 pr-2">
      <div className="flex flex-wrap items-center gap-6">
        <NavLink className="font-display text-lg font-semibold tracking-wide" to="/dashboard">TaskMate</NavLink>
        <nav aria-label="Pestañas principales" className="flex flex-wrap gap-1">
          {tabs.map(({ label, to }) => (
            <NavLink className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')} key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-slate-400 sm:inline">{email ?? 'Espacio personal'}</span>
        <button aria-label="Cerrar sesión" className="icon-button" onClick={onLogout} title="Cerrar sesión" type="button"><LogOut size={18} /></button>
      </div>
    </header>
  )
}
