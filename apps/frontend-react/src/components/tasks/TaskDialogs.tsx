import type { Category, Task, TaskInput } from '../../types/api'
import { CategoryManager } from '../categories/CategoryManager'
import { DeleteTaskModal } from './DeleteTaskModal'
import { TaskModal } from './TaskModal'

// Un solo diálogo abierto a la vez: formulario crear/editar, confirmación de borrado o categorías.
export type TaskDialog =
  | { kind: 'form'; task: Task | null }
  | { kind: 'delete'; task: Task }
  | { kind: 'categories' }
  | null

interface TaskDialogsProps {
  dialog: TaskDialog
  categories: Category[]
  isSaving: boolean
  pendingId: string | null
  onClose: () => void
  onSave: (input: TaskInput) => void
  onDelete: (task: Task) => void
  onCategoriesChanged: () => void
}

export function TaskDialogs({ dialog, categories, isSaving, pendingId, onClose, onSave, onDelete, onCategoriesChanged }: TaskDialogsProps) {
  if (!dialog) return null

  if (dialog.kind === 'delete') {
    const task = dialog.task

    return <DeleteTaskModal isDeleting={pendingId === task.id} onClose={onClose} onConfirm={() => onDelete(task)} task={task} />
  }

  if (dialog.kind === 'categories') {
    return <CategoryManager categories={categories} onChanged={onCategoriesChanged} onClose={onClose} />
  }

  return <TaskModal categories={categories} isSaving={isSaving} onClose={onClose} onSubmit={onSave} task={dialog.task} />
}
