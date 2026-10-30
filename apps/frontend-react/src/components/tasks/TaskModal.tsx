import { useState, type FormEvent } from 'react'
import type { Category, Task, TaskInput, TaskPriority, TaskStatus } from '../../types/api'
import { SubtaskGenerator } from '../ai/SubtaskGenerator'
import { fieldClass } from '../ui/fieldClass'
import { Modal } from '../ui/Modal'
import { SelectField } from '../ui/SelectField'
import { appendSubtasks, priorityOptions, statusOptions, toCategoryOptions, toFormValues, toTaskInput, type TaskFormValues } from './taskUtils'

interface TaskModalProps {
  task: Task | null
  categories: Category[]
  isSaving: boolean
  onSubmit: (input: TaskInput) => void
  onClose: () => void
}

function submitLabel(isSaving: boolean, isEditing: boolean) {
  if (isSaving) return 'Guardando...'

  return isEditing ? 'Guardar cambios' : 'Crear tarea'
}

export function TaskModal({ task, categories, isSaving, onSubmit, onClose }: TaskModalProps) {
  const [values, setValues] = useState(() => toFormValues(task))
  const setField = <K extends keyof TaskFormValues>(key: K) => (value: TaskFormValues[K]) => setValues((current) => ({ ...current, [key]: value }))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(toTaskInput(values))
  }

  return (
    <Modal onClose={onClose} title={task ? 'Editar tarea' : 'Nueva tarea'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">Título
          <input autoFocus className={fieldClass} maxLength={120} onChange={(event) => setField('title')(event.target.value)} required value={values.title} />
        </label>
        <label className="block text-sm font-medium">Descripción
          <textarea className={fieldClass} onChange={(event) => setField('description')(event.target.value)} rows={3} value={values.description} />
        </label>
        {task && <SubtaskGenerator onAccept={(subtasks) => setValues((current) => ({ ...current, description: appendSubtasks(current.description, subtasks) }))} taskId={task.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField<TaskPriority> label="Prioridad" onChange={setField('priority')} options={priorityOptions} value={values.priority} />
          <SelectField<TaskStatus> label="Estado" onChange={setField('status')} options={statusOptions} value={values.status} />
          <SelectField label="Categoría" onChange={setField('categoryId')} options={toCategoryOptions(categories, 'Sin categoría')} value={values.categoryId} />
          <label className="block text-sm font-medium">Fecha de vencimiento
            <input className={fieldClass} onChange={(event) => setField('dueDate')(event.target.value)} type="date" value={values.dueDate} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800" onClick={onClose} type="button">Cancelar</button>
          <button className="command-button disabled:opacity-60" disabled={isSaving || !values.title.trim()} type="submit">{submitLabel(isSaving, task !== null)}</button>
        </div>
      </form>
    </Modal>
  )
}
