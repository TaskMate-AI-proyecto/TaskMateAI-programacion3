import { Outlet } from 'react-router-dom'
import { CommandPaletteProvider } from '../command-palette/CommandPaletteProvider'
import { useAuth } from '../hooks/useAuth'
import { Atmosphere } from './layout/Atmosphere'
import { SidebarCapsule } from './layout/SidebarCapsule'
import { TopPill } from './layout/TopPill'

// Layout de las vistas protegidas: fondo oscuro con atmósfera, cápsula lateral y barra en píldora.
// La paleta de comandos (Ctrl/Cmd+K) vive aquí porque necesita el router y todas las vistas protegidas.
export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <CommandPaletteProvider>
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <Atmosphere />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6 md:grid md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
          <SidebarCapsule />
          <div className="flex min-w-0 flex-col gap-5">
            <TopPill email={user?.email ?? null} onLogout={logout} />
            <main className="min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </CommandPaletteProvider>
  )
}
