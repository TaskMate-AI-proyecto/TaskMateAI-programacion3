import { useState, type FormEvent } from 'react'
import type { Category, Task, TaskInput, TaskPriority, TaskStatus } from '../../types/api'
import { Modal } from '../ui/Modal'
import { fieldClass, priorityLabels, statusLabels } from './taskUtils'

interface TaskModalProps {
  task: Task | null
  categories: Category[]
  isSaving: boolean
  onSubmit: (input: TaskInput) => void
  onClose: () => void
}

export function TaskModal({ task, categories, isSaving, onSubmit, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'PENDING')
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      categoryId: categoryId || undefined,
      dueDate: dueDate || undefined,
    })
  }

  return (
    <Modal onClose={onClose} title={task ? 'Editar tarea' : 'Nueva tarea'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">Título
          <input autoFocus className={fieldClass} maxLength={120} onChange={(event) => setTitle(event.target.value)} required value={title} />
        </label>
        <label className="block text-sm font-medium">Descripción
          <textarea className={fieldClass} onChange={(event) => setDescription(event.target.value)} rows={3} value={description} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Prioridad
            <select className={fieldClass} onChange={(event) => setPriority(event.target.value as TaskPriority)} value={priority}>
              {(Object.keys(priorityLabels) as TaskPriority[]).map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Estado
            <select className={fieldClass} onChange={(event) => setStatus(event.target.value as TaskStatus)} value={status}>
              {(Object.keys(statusLabels) as TaskStatus[]).map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Categoría
            <select className={fieldClass} onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
              <option value="">Sin categoría</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Fecha de vencimiento
            <input className={fieldClass} onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="rounded-md px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5" onClick={onClose} type="button">Cancelar</button>
          <button className="command-button disabled:opacity-60" disabled={isSaving || !title.trim()} type="submit">{isSaving ? 'Guardando...' : task ? 'Guardar cambios' : 'Crear tarea'}</button>
        </div>
      </form>
    </Modal>
  )
}
