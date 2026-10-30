import { motion, useReducedMotion } from 'framer-motion'
import type { Task } from '../../types/api'
import { barRatio, buildPriorityBars, completionPercent, type PriorityBar } from './productivity'

function describeBars(bars: PriorityBar[]) {
  return bars.map((bar) => `${bar.label}: ${bar.completed} de ${bar.total} completadas`).join('. ')
}

function BarColumn({ bar, bars }: { bar: PriorityBar; bars: PriorityBar[] }) {
  const ratio = barRatio(bar, bars)
  const doneRatio = bar.total === 0 ? 0 : bar.completed / bar.total
  // El crecimiento de la barra es altura, no transformación: con movimiento reducido se muestra de golpe.
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="flex h-40 w-full items-end justify-center">
        <motion.div
          animate={{ height: `${Math.max(ratio * 100, bar.total ? 6 : 2)}%` }}
          className="flex w-full max-w-[56px] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          initial={false}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: 'easeOut' }}
        >
          <div className="w-full bg-gradient-to-t from-indigo-600 to-violet-500" style={{ height: `${doneRatio * 100}%` }} />
        </motion.div>
      </div>
      <p className="text-xs font-medium text-slate-300">{bar.label}</p>
      <p className="text-[11px] text-slate-500">{bar.completed}/{bar.total}</p>
    </div>
  )
}

// Gráfico de barras de productividad: por prioridad, la parte completada se pinta sobre el total.
export function ProductivityChart({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  const bars = buildPriorityBars(tasks)
  const percent = completionPercent(bars)

  return (
    <section aria-labelledby="productivity-title" className="glass-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-slate-100" id="productivity-title">Productividad</h2>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">{percent}% completadas</span>
      </div>
      {isLoading ? (
        <div aria-busy="true" className="mt-6 h-44 animate-pulse rounded-2xl bg-slate-800/50" />
      ) : (
        <div aria-label={describeBars(bars)} className="mt-6 flex gap-3" role="img">
          {bars.map((bar) => <BarColumn bar={bar} bars={bars} key={bar.priority} />)}
        </div>
      )}
    </section>
  )
}
