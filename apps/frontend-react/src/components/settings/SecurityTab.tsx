import { useState } from 'react'
import { Download } from 'lucide-react'
import { deleteTask, getTasks } from '../../api/tasksApi'
import { getApiErrorMessage } from '../../api/errors'
import { useToast } from '../../hooks/useToast'
import { exportTasks, type ExportFormat } from '../../settings/exporters'
import type { Task } from '../../types/api'
import { ConfirmDialog } from './ConfirmDialog'
import { ProductivityReportExport } from '../reports/ProductivityReportExport'

// Seguridad y datos: exportación de las tareas y zona de peligro para borrarlas todas.
export function SecurityTab() {
  const { notify } = useToast()
  const [resetTasks, setResetTasks] = useState<Task[] | null>(null)
  const [busy, setBusy] = useState(false)

  async function exportData(format: ExportFormat) {
    try {
      exportTasks(format, await getTasks())
      notify(`Tareas exportadas en ${format.toUpperCase()}`)
    } catch (error) {
      notify(getApiErrorMessage(error, 'No se pudieron exportar las tareas.'), 'error')
    }
  }

  async function askReset() {
    try {
      const tasks = await getTasks()
      if (tasks.length === 0) notify('No tienes tareas que eliminar')
      else setResetTasks(tasks)
    } catch (error) {
      notify(getApiErrorMessage(error, 'No se pudieron cargar las tareas.'), 'error')
    }
  }

  async function confirmReset() {
    if (!resetTasks) return

    setBusy(true)
    try {
      await Promise.all(resetTasks.map((task) => deleteTask(task.id)))
      setResetTasks(null)
      notify('Tareas eliminadas')
    } catch (error) {
      notify(getApiErrorMessage(error, 'No se pudieron eliminar todas las tareas.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-3 rounded-2xl border border-glass/10 bg-glass/5 p-5">
        <h2 className="font-semibold text-slate-100">Exportar tareas</h2>
        <p className="text-xs text-slate-400">Descarga una copia de tus tareas para guardarla o usarla en otra herramienta. El reporte PDF resume tu productividad con un análisis de Groq.</p>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-glass/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-glass/10" onClick={() => void exportData('json')} type="button"><Download size={16} />JSON</button>
          <button className="inline-flex items-center gap-2 rounded-md border border-glass/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-glass/10" onClick={() => void exportData('csv')} type="button"><Download size={16} />CSV</button>
          <ProductivityReportExport />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
        <h2 className="font-semibold text-red-700 dark:text-red-300">Zona de peligro</h2>
        <p className="text-sm text-slate-400">Elimina todas tus tareas de forma permanente. Tus categorías y tu cuenta se conservan.</p>
        <button className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110" onClick={() => void askReset()} type="button">Restablecer tareas</button>
      </div>

      {resetTasks && (
        <ConfirmDialog busy={busy} confirmLabel="Eliminar todo" message={`Se eliminarán ${resetTasks.length} tareas. Esta acción no se puede deshacer.`} onCancel={() => setResetTasks(null)} onConfirm={() => void confirmReset()} title="¿Restablecer todas las tareas?" />
      )}
    </section>
  )
}
