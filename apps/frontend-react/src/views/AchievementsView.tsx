import { motion } from 'framer-motion'
import { Flame, Lock, Trophy } from 'lucide-react'
import { getApiErrorMessage } from '../api/errors'
import { getGamificationProfile } from '../api/gamificationApi'
import { ErrorPanel } from '../components/ui/ErrorPanel'
import { useAsyncData } from '../hooks/useAsyncData'
import type { AchievementStatus, GamificationProfile } from '../types/api'
import { levelProgressPercent } from '../utils/gamification'

function formatUnlockedAt(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StreakStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-glass/10 bg-glass/5 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-400"><Flame className="text-coral" size={14} />{label}</p>
      <p className="font-display text-3xl font-semibold text-slate-100">
        {value} <span className="text-sm font-normal text-slate-400">{value === 1 ? 'día' : 'días'}</span>
      </p>
    </div>
  )
}

function LevelCard({ profile }: { profile: GamificationProfile }) {
  const percent = levelProgressPercent(profile)

  return (
    <section aria-labelledby="level-title" className="rounded-3xl border border-glass/10 bg-glass/5 p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Nivel actual</p>
          <h2 className="font-display text-5xl font-semibold text-slate-100" id="level-title">Nivel {profile.level}</h2>
          <p className="mt-2 text-sm text-slate-400">
            {profile.xp} XP · faltan {profile.nextLevelXp - profile.xp} XP para el nivel {profile.level + 1}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StreakStat label="Racha actual" value={profile.currentStreak} />
          <StreakStat label="Racha máxima" value={profile.longestStreak} />
        </div>
      </div>
      <div
        aria-label="Progreso hacia el siguiente nivel"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(percent)}
        className="mt-6 h-3 overflow-hidden rounded-full bg-glass/10"
        role="progressbar"
      >
        <motion.div
          animate={{ width: `${percent}%` }}
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
          initial={{ width: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    </section>
  )
}

function AchievementCard({ item }: { item: AchievementStatus }) {
  if (item.unlocked) {
    return (
      <li className="rounded-2xl border border-indigo-400/60 bg-indigo-500/10 p-4 shadow-[0_0_24px_-6px_rgba(99,102,241,0.7)]">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
          <Trophy size={18} />
          <h3 className="font-semibold text-slate-100">{item.title}</h3>
        </div>
        <p className="mt-2 text-sm text-slate-300">{item.description}</p>
        {item.unlockedAt && <p className="mt-3 text-xs text-slate-400">Obtenido el {formatUnlockedAt(item.unlockedAt)}</p>}
      </li>
    )
  }

  return (
    <li className="rounded-2xl border border-glass/10 bg-glass/5 p-4 opacity-50">
      <div className="flex items-center gap-2 text-slate-400">
        <Lock size={18} />
        <h3 className="font-semibold text-slate-200">{item.title}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-400">Requisito: {item.description}</p>
    </li>
  )
}

function AchievementsBody({ profile, error, onRetry }: { profile: GamificationProfile | null; error: string | null; onRetry: () => void }) {
  if (profile) {
    return (
      <>
        <LevelCard profile={profile} />
        <ul aria-label="Insignias" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profile.achievements.map((item) => <AchievementCard item={item} key={item.key} />)}
        </ul>
      </>
    )
  }

  if (error) return <ErrorPanel message={error} onRetry={onRetry} />

  return <div aria-busy="true" className="glass-card h-56 animate-pulse" />
}

// Vista de niveles y logros: nivel y XP, rachas y el catálogo de insignias.
export function AchievementsView() {
  const { data, error, reload } = useAsyncData(getGamificationProfile, 'gamification-profile', {
    describeError: (requestError) => getApiErrorMessage(requestError, 'No se pudieron cargar tus logros.'),
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Progreso</p>
        <h1 className="font-display text-4xl font-semibold text-slate-100">Logros y progreso</h1>
        <p className="mt-2 max-w-lg text-slate-400">Completa tareas para ganar XP, mantener tu racha y desbloquear insignias.</p>
      </div>
      <AchievementsBody error={error} onRetry={reload} profile={data} />
    </div>
  )
}
