import type { Task } from '../../types/api'
import { Modal } from '../ui/Modal'

interface DeleteTaskModalProps {
  task: Task
  isDeleting: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeleteTaskModal({ task, isDeleting, onConfirm, onClose }: DeleteTaskModalProps) {
  return (
    <Modal onClose={onClose} title="Eliminar tarea">
      <p className="text-sm leading-6 text-slate-400">
        Vas a eliminar <strong className="text-slate-100">{task.title}</strong>. Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-end gap-2 pt-6">
        <button className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50" disabled={isDeleting} onClick={onClose} type="button">Cancelar</button>
        <button className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isDeleting} onClick={onConfirm} type="button">{isDeleting ? 'Eliminando...' : 'Eliminar'}</button>
      </div>
    </Modal>
  )
}
