import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Tags } from 'lucide-react'
import { getCategories } from '../api/categoriesApi'
import { getApiErrorMessage } from '../api/errors'
import { createTask, deleteTask, getTasks, toggleTaskStatus, updateTask } from '../api/tasksApi'
import { CategoryManager } from '../components/categories/CategoryManager'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskList } from '../components/tasks/TaskList'
import { TaskModal } from '../components/tasks/TaskModal'
import { emptyFilters, filterTasks, hasActiveFilters, type TaskFilterState } from '../components/tasks/taskUtils'
import { useToast } from '../hooks/useToast'
import type { Category, Task, TaskInput } from '../types/api'

export function Tasks() {
  const { notify } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<TaskFilterState>(emptyFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [modal, setModal] = useState<{ task: Task | null } | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void Promise.all([getTasks({ categoryId: filters.categoryId || undefined }), getCategories()])
      .then(([nextTasks, nextCategories]) => {
        if (cancelled) return
        setTasks(nextTasks)
        setCategories(nextCategories)
        setError(null)
      })
      .catch((requestError) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, 'No se pudieron cargar las tareas.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [filters.categoryId, reloadKey])

  function refresh() {
    setReloadKey((key) => key + 1)
  }

  function retry() {
    setIsLoading(true)
    refresh()
  }

  async function handleSave(input: TaskInput) {
    const editing = modal?.task ?? null
    setIsSaving(true)
    try {
      if (editing) await updateTask(editing.id, input)
      else await createTask(input)
      notify(editing ? 'Tarea actualizada' : 'Tarea creada')
      setModal(null)
      refresh()
    } catch (requestError) {
      notify(getApiErrorMessage(requestError), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggle(task: Task) {
    setPendingId(task.id)
    try {
      const updated = await toggleTaskStatus(task)
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (requestError) {
      notify(getApiErrorMessage(requestError), 'error')
    } finally {
      setPendingId(null)
    }
  }

  async function handleDelete(task: Task) {
    setPendingId(task.id)
    try {
      await deleteTask(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      notify('Tarea eliminada')
    } catch (requestError) {
      notify(getApiErrorMessage(requestError), 'error')
    } finally {
      setPendingId(null)
    }
  }

  const visibleTasks = filterTasks(tasks, filters)

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
      {error ? (
        <div className="empty-state rounded-md" role="alert">
          <p className="text-coral">{error}</p>
          <button className="command-button" onClick={retry} type="button"><RefreshCw size={16} />Reintentar</button>
        </div>
      ) : (
        <TaskList
          hasFilters={hasActiveFilters(filters)}
          isLoading={isLoading}
          onClearFilters={() => setFilters(emptyFilters)}
          onCreate={() => setModal({ task: null })}
          onDelete={(task) => void handleDelete(task)}
          onEdit={(task) => setModal({ task })}
          onToggle={(task) => void handleToggle(task)}
          pendingId={pendingId}
          tasks={visibleTasks}
        />
      )}
      {modal && <TaskModal categories={categories} isSaving={isSaving} onClose={() => setModal(null)} onSubmit={(input) => void handleSave(input)} task={modal.task} />}
      {showCategories && <CategoryManager categories={categories} onChanged={refresh} onClose={() => setShowCategories(false)} />}
    </div>
  )
}
