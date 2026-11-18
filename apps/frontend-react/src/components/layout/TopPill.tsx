import { LogOut, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { FriendsModal } from '../friends/FriendsModal'
import { ThemeToggle } from './ThemeToggle'

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
  const [friendsOpen, setFriendsOpen] = useState(false)
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
        <button aria-label="Amigos" className="icon-button" onClick={() => setFriendsOpen(true)} title="Amigos" type="button"><Users size={18} /></button>
        <ThemeToggle />
        <button aria-label="Cerrar sesión" className="icon-button" onClick={onLogout} title="Cerrar sesión" type="button"><LogOut size={18} /></button>
      </div>
      {friendsOpen && <FriendsModal onClose={() => setFriendsOpen(false)} />}
    </header>
  )
}
