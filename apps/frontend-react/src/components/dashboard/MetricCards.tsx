import type { Task } from '../../types/api'
import { buildMetrics } from './dashboardStats'

export function MetricCards({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {buildMetrics(tasks).map(({ label, value, icon: Icon }) => (
        <article className="rounded-md border border-ink/10 bg-white p-4" key={label}>
          <Icon className="text-ink/45" size={18} />
          {isLoading ? <div className="mt-3 h-8 w-10 animate-pulse rounded bg-ink/10" /> : <p className="mt-3 font-display text-3xl font-semibold">{value}</p>}
          <p className="text-xs text-ink/60">{label}</p>
        </article>
      ))}
    </div>
  )
}
