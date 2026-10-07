import { CheckCircle2, Plus } from 'lucide-react'

export function TasksPage() {
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Planificación</p><h1 className="font-display text-4xl font-semibold">Tareas</h1></div><button className="command-button" type="button"><Plus size={18} />Nueva tarea</button></div><div className="empty-state"><CheckCircle2 size={28} /><p>Las tareas aparecerán aquí al conectarlas con la API.</p></div></div>
}