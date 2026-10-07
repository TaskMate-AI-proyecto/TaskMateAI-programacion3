import { CircleUserRound, LayoutDashboard, ListTodo, LogOut, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navigation = [
  { label: 'Resumen', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Tareas', to: '/tasks', icon: ListTodo },
]

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-ink/10 bg-white/80 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <NavLink className="font-display text-xl font-semibold tracking-wide" to="/dashboard">TaskMate</NavLink>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-ink/60 sm:inline">{user?.email ?? 'Espacio personal'}</span>
            <button aria-label="Cerrar sesión" className="icon-button" onClick={logout} title="Cerrar sesión" type="button"><LogOut size={18} /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-[180px_1fr]">
        <nav aria-label="Navegación principal" className="flex gap-2 md:flex-col">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} key={to} to={to}><Icon size={18} />{label}</NavLink>
          ))}
          <span className="nav-link text-ink/40"><Settings size={18} />Ajustes</span>
        </nav>
        <section><Outlet /></section>
      </main>
      <footer className="mx-auto flex max-w-6xl items-center gap-2 px-5 pb-6 text-sm text-ink/50 sm:px-8"><CircleUserRound size={15} />Organiza tu ritmo de trabajo.</footer>
    </div>
  )
}