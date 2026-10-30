import { useState } from 'react'
import { Plus, Tags } from 'lucide-react'
import { deleteTask, createTask, toggleTaskStatus, updateTask } from '../api/tasksApi'
import { TaskDialogs, type TaskDialog } from '../components/tasks/TaskDialogs'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskList } from '../components/tasks/TaskList'
import { emptyFilters, filterTasks, hasActiveFilters, type TaskFilterState } from '../components/tasks/taskUtils'
import { ErrorPanel } from '../components/ui/ErrorPanel'
import { useSafeAction } from '../hooks/useSafeAction'
import { useTasksData } from '../hooks/useTasksData'
import { useRefreshOnTaskChanges } from '../hooks/useTaskSync'
import { useToast } from '../hooks/useToast'
import type { Task, TaskInput } from '../types/api'

function saveTask(editing: Task | null, input: TaskInput) {
  return editing ? updateTask(editing.id, input) : createTask(input)
}

function replaceTask(list: Task[], updated: Task) {
  return list.map((item) => (item.id === updated.id ? updated : item))
}

function editingTask(dialog: TaskDialog) {
  return dialog?.kind === 'form' ? dialog.task : null
}

export function Tasks() {
  const { notify } = useToast()
  const runSafely = useSafeAction()
  const [filters, setFilters] = useState<TaskFilterState>(emptyFilters)
  const [dialog, setDialog] = useState<TaskDialog>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const { tasks, categories, error, isLoading, updateTasks, refresh, reload } = useTasksData(filters.categoryId)
  // Si el asistente cambia tareas mientras esta vista está abierta, el listado se vuelve a pedir.
  useRefreshOnTaskChanges(refresh)

  async function runForTask<T>(task: Task, action: () => Promise<T>) {
    setPendingId(task.id)
    const result = await runSafely(action)
    setPendingId(null)
    return result
  }

  // Con un filtro de categoría la tarea guardada puede dejar de pertenecer a la lista: se vuelve a pedir.
  // Sin filtro se actualiza el estado local con la respuesta de la API, sin recargar.
  async function handleSave(input: TaskInput) {
    const editing = editingTask(dialog)
    setIsSaving(true)
    const result = await runSafely(() => saveTask(editing, input))
    setIsSaving(false)
    if (!result.ok) return

    notify(editing ? 'Tarea actualizada' : 'Tarea creada')
    setDialog(null)
    if (filters.categoryId) refresh()
    else updateTasks((list) => (editing ? replaceTask(list, result.value) : [result.value, ...list]))
  }

  async function handleToggle(task: Task) {
    const result = await runForTask(task, () => toggleTaskStatus(task))
    if (result.ok) updateTasks((list) => replaceTask(list, result.value))
  }

  async function handleDelete(task: Task) {
    const result = await runForTask(task, () => deleteTask(task.id))
    if (!result.ok) return

    setDialog(null)
    updateTasks((list) => list.filter((item) => item.id !== task.id))
    notify('Tarea eliminada')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Tareas</p><h1 className="font-display text-4xl font-semibold">Tu lista de trabajo.</h1></div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-md hover:border-indigo-500/60" onClick={() => setDialog({ kind: 'categories' })} type="button"><Tags size={16} />Categorías</button>
          <button className="command-button" onClick={() => setDialog({ kind: 'form', task: null })} type="button"><Plus size={16} />Nueva tarea</button>
        </div>
      </div>
      <TaskFilters categories={categories} filters={filters} onChange={(changes) => setFilters((current) => ({ ...current, ...changes }))} />
      {error ? <ErrorPanel message={error} onRetry={reload} /> : (
        <TaskList
          hasFilters={hasActiveFilters(filters)}
          isLoading={isLoading}
          onClearFilters={() => setFilters(emptyFilters)}
          onCreate={() => setDialog({ kind: 'form', task: null })}
          onDelete={(task) => setDialog({ kind: 'delete', task })}
          onEdit={(task) => setDialog({ kind: 'form', task })}
          onToggle={(task) => void handleToggle(task)}
          pendingId={pendingId}
          tasks={filterTasks(tasks, filters)}
        />
      )}
      <TaskDialogs
        categories={categories}
        dialog={dialog}
        isSaving={isSaving}
        onCategoriesChanged={refresh}
        onClose={() => setDialog(null)}
        onDelete={(task) => void handleDelete(task)}
        onSave={(input) => void handleSave(input)}
        pendingId={pendingId}
      />
    </div>
  )
}
