import { Bot, Clock, ListTodo } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Task } from '../../types/api'
import { isOverdue, priorityLabels, priorityStyles } from '../tasks/taskUtils'
import { Badge } from '../ui/Badge'

const analyzedLimit = 5

interface ChatContextPanelProps {
  email?: string
  pending: Task[]
}

function ContextMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="font-display text-2xl font-semibold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}

// Panel derecho: perfil del asistente, métricas del contexto y acceso rápido a las tareas que analiza.
export function ChatContextPanel({ email, pending }: ChatContextPanelProps) {
  const highPriority = pending.filter((task) => task.priority === 'HIGH').length
  const overdue = pending.filter(isOverdue).length
  const analyzed = pending.slice(0, analyzedLimit)

  return (
    <aside aria-label="Contexto de TaskMate AI" className="glass-card flex min-h-[32rem] flex-col gap-5 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600">
          <Bot size={22} />
        </span>
        <div>
          <p className="font-semibold text-slate-100">TaskMate AI</p>
          <p className="text-xs text-slate-400">Asistente de gestión de tareas</p>
        </div>
      </div>

      <div aria-label="Métricas del contexto" className="grid grid-cols-3 gap-2" role="group">
        <ContextMetric label="Pendientes" value={pending.length} />
        <ContextMetric label="Alta prioridad" value={highPriority} />
        <ContextMetric label="Vencidas" value={overdue} />
      </div>

      <section aria-labelledby="analyzed-title" className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200" id="analyzed-title"><ListTodo size={16} />Tareas analizadas</h2>
        {analyzed.length === 0 ? <p className="text-sm text-slate-500">No hay tareas pendientes para analizar.</p> : (
          <ul className="space-y-2">
            {analyzed.map((task) => (
              <li key={task.id}>
                <Link className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10" to="/tasks">
                  <span className="min-w-0 truncate text-sm text-slate-100">{task.title}</span>
                  <Badge tone={priorityStyles[task.priority]}>{priorityLabels[task.priority]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="context-title" className="mt-auto space-y-2 text-sm text-slate-400">
        <h2 className="flex items-center gap-2 font-semibold text-slate-200" id="context-title"><Clock size={16} />Contexto activo</h2>
        <p>Workspace de {email ?? 'tu espacio personal'}.</p>
      </section>
    </aside>
  )
}
