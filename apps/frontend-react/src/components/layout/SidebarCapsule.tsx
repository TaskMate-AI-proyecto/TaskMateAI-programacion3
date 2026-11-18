import { Bot, Home, ListTodo, MessageCircle, Search, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useCommandPalette } from '../../hooks/useCommandPalette'
import { cn } from '../../utils/cn'
import { StreakIndicator } from '../gamification/StreakIndicator'
import { WorkspaceSidebar } from '../workspaces/WorkspaceSidebar'

const navigation = [
  { label: 'Inicio', to: '/dashboard', icon: Home },
  { label: 'Tareas', to: '/tasks', icon: ListTodo },
  { label: 'Mensajes', to: '/messages', icon: MessageCircle },
  { label: 'Chat IA', to: '/chat', icon: Bot },
  { label: 'Ajustes', to: '/settings', icon: Settings },
]

// Cápsula flotante con los accesos rápidos a las secciones de la app.
export function SidebarCapsule() {
  const { open } = useCommandPalette()

  return (
    <nav aria-label="Navegación principal" className="nav-capsule flex-row self-start md:sticky md:top-6 md:flex-col md:w-[88px] md:px-2.5">
      <button
        aria-label="Buscar comandos"
        className="nav-icon"
        onClick={open}
        title="Buscar comandos (Ctrl+K / ⌘K)"
        type="button"
      >
        <Search size={20} />
      </button>
      {navigation.map(({ label, to, icon: Icon }) => (
        <NavLink
          aria-label={label}
          className={({ isActive }) => cn('nav-icon', isActive && 'nav-link-active')}
          key={to}
          title={label}
          to={to}
        >
          <Icon size={20} />
        </NavLink>
      ))}
      <StreakIndicator />
      <WorkspaceSidebar />
    </nav>
  )
}
