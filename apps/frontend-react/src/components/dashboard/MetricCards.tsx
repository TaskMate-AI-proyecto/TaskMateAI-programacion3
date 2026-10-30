import type { Task } from '../../types/api'
import { buildMetrics } from './dashboardStats'

export function MetricCards({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {buildMetrics(tasks).map(({ label, value, icon: Icon }) => (
        <article className="glass-card p-4 transition duration-200 hover:border-indigo-500/40 motion-safe:hover:scale-[1.01]" key={label}>
          <Icon className="text-indigo-400" size={18} />
          {isLoading ? <div className="mt-3 h-8 w-10 animate-pulse rounded bg-slate-800/70" /> : <p className="mt-3 font-display text-3xl font-semibold text-slate-100">{value}</p>}
          <p className="text-xs text-slate-400">{label}</p>
        </article>
      ))}
    </div>
  )
}
