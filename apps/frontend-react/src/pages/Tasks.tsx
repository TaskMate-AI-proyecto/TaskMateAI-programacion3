import { useState } from 'react'
import { Plus, Tags } from 'lucide-react'
import { deleteTask, createTask, toggleTaskStatus, updateTask } from '../api/tasksApi'
import { CategoryManager } from '../components/categories/CategoryManager'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskList } from '../components/tasks/TaskList'
import { TaskModal } from '../components/tasks/TaskModal'
import { emptyFilters, filterTasks, hasActiveFilters, type TaskFilterState } from '../components/tasks/taskUtils'
import { ErrorPanel } from '../components/ui/ErrorPanel'
import { useSafeAction } from '../hooks/useSafeAction'
import { useTasksData } from '../hooks/useTasksData'
import { useToast } from '../hooks/useToast'
import type { Task, TaskInput } from '../types/api'

function saveTask(editing: Task | null, input: TaskInput) {
  return editing ? updateTask(editing.id, input) : createTask(input)
}

function replaceTask(list: Task[], updated: Task) {
  return list.map((item) => (item.id === updated.id ? updated : item))
}

export function Tasks() {
  const { notify } = useToast()
  const runSafely = useSafeAction()
  const [filters, setFilters] = useState<TaskFilterState>(emptyFilters)
  const [modal, setModal] = useState<{ task: Task | null } | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const { tasks, categories, error, isLoading, updateTasks, refresh, reload } = useTasksData(filters.categoryId)

  async function runForTask<T>(task: Task, action: () => Promise<T>) {
    setPendingId(task.id)
    const result = await runSafely(action)
    setPendingId(null)
    return result
  }

  async function handleSave(input: TaskInput) {
    const editing = modal?.task ?? null
    setIsSaving(true)
    const result = await runSafely(() => saveTask(editing, input))
    if (result.ok) {
      notify(editing ? 'Tarea actualizada' : 'Tarea creada')
      setModal(null)
      refresh()
    }
    setIsSaving(false)
  }

  async function handleToggle(task: Task) {
    const result = await runForTask(task, () => toggleTaskStatus(task))
    if (result.ok) updateTasks((list) => replaceTask(list, result.value))
  }

  async function handleDelete(task: Task) {
    const result = await runForTask(task, () => deleteTask(task.id))
    if (!result.ok) return
    updateTasks((list) => list.filter((item) => item.id !== task.id))
    notify('Tarea eliminada')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Tareas</p><h1 className="font-display text-4xl font-semibold">Tu lista de trabajo.</h1></div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold hover:border-ink/40" onClick={() => setShowCategories(true)} type="button"><Tags size={16} />Categorías</button>
          <button className="command-button" onClick={() => setModal({ task: null })} type="button"><Plus size={16} />Nueva tarea</button>
        </div>
      </div>
      <TaskFilters categories={categories} filters={filters} onChange={(changes) => setFilters((current) => ({ ...current, ...changes }))} />
      {error ? <ErrorPanel message={error} onRetry={reload} /> : (
        <TaskList
          hasFilters={hasActiveFilters(filters)}
          isLoading={isLoading}
          onClearFilters={() => setFilters(emptyFilters)}
          onCreate={() => setModal({ task: null })}
          onDelete={(task) => void handleDelete(task)}
          onEdit={(task) => setModal({ task })}
          onToggle={(task) => void handleToggle(task)}
          pendingId={pendingId}
          tasks={filterTasks(tasks, filters)}
        />
      )}
      {modal && <TaskModal categories={categories} isSaving={isSaving} onClose={() => setModal(null)} onSubmit={(input) => void handleSave(input)} task={modal.task} />}
      {showCategories && <CategoryManager categories={categories} onChanged={refresh} onClose={() => setShowCategories(false)} />}
    </div>
  )
}
