import { Flame } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useGamification } from '../../hooks/useGamification'

// Indicador compacto de la cápsula lateral: días de racha y nivel. Lleva a la vista de logros.
export function StreakIndicator() {
  const gamification = useGamification()
  const profile = gamification?.profile

  if (!profile) return null

  return (
    <NavLink
      aria-label={`Logros: racha de ${profile.currentStreak} días, nivel ${profile.level}`}
      className="flex w-full flex-col items-center gap-1.5 rounded-full border border-glass/10 bg-glass/5 px-2 py-2 text-xs text-slate-100 shadow-[0_0_18px_-8px_rgba(239,111,94,0.6)] backdrop-blur-xl transition hover:bg-glass/10"
      title="Logros y progreso"
      to="/achievements"
    >
      <span className="flex items-center gap-1 font-semibold">
        <Flame className="text-coral" size={16} />
        {profile.currentStreak}
      </span>
      <span className="whitespace-nowrap rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 px-2.5 py-1 text-[11px] font-bold text-white">
        Nvl {profile.level}
      </span>
    </NavLink>
  )
}
