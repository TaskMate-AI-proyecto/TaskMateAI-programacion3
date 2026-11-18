import { useState, type ReactNode } from 'react'
import { Bot, Palette, ShieldCheck, User, type LucideIcon } from 'lucide-react'
import { AppearanceTab } from '../components/settings/AppearanceTab'
import { AssistantTab } from '../components/settings/AssistantTab'
import { ProfileTab } from '../components/settings/ProfileTab'
import { SecurityTab } from '../components/settings/SecurityTab'
import type { SettingsTab } from '../settings/settings'
import { cn } from '../utils/cn'

const tabs: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'assistant', label: 'Asistente IA', icon: Bot },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'security', label: 'Seguridad & Datos', icon: ShieldCheck },
]

const panels: Record<SettingsTab, ReactNode> = {
  profile: <ProfileTab />,
  assistant: <AssistantTab />,
  appearance: <AppearanceTab />,
  security: <SecurityTab />,
}

// Ajustes en una tarjeta Glassy: pestañas laterales en escritorio y horizontales en móvil.
export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>('profile')

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Ajustes</p>
        <h1 className="font-display text-4xl font-semibold text-slate-100">Tu espacio, a tu medida.</h1>
        <p className="mt-2 max-w-lg text-slate-400">Perfil, asistente, apariencia y datos de tu cuenta.</p>
      </div>

      <div className="glass-card grid overflow-hidden md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Secciones de ajustes" className="flex gap-1 overflow-x-auto border-b border-glass/10 p-3 md:flex-col md:border-b-0 md:border-r md:p-4" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => {
            const selected = tab === id

            return (
              <button aria-controls={`settings-panel-${id}`} aria-selected={selected} className={cn('flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition', selected ? 'nav-link-active' : 'text-slate-400 hover:bg-glass/5 hover:text-slate-100')} id={`settings-tab-${id}`} key={id} onClick={() => setTab(id)} role="tab" type="button">
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </nav>
        <div aria-labelledby={`settings-tab-${tab}`} className="min-w-0 p-6 md:p-8" id={`settings-panel-${tab}`} role="tabpanel">
          {panels[tab]}
        </div>
      </div>
    </div>
  )
}
