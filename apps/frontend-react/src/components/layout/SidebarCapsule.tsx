import { Bot, Home, ListTodo, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'

const navigation = [
  { label: 'Inicio', to: '/dashboard', icon: Home },
  { label: 'Tareas', to: '/tasks', icon: ListTodo },
  { label: 'Chat IA', to: '/chat', icon: Bot },
]

// Cápsula flotante con los accesos rápidos. Configuración aún no tiene pantalla: queda deshabilitada.
export function SidebarCapsule() {
  return (
    <nav aria-label="Navegación principal" className="nav-capsule flex-row self-start md:sticky md:top-6 md:flex-col">
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
      <span aria-disabled="true" aria-label="Configuración" className="nav-icon cursor-not-allowed opacity-40" title="Configuración (próximamente)">
        <Settings size={20} />
      </span>
    </nav>
  )
}
