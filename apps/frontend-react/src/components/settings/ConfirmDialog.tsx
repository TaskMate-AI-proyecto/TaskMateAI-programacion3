import { Modal } from '../ui/Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Confirmación de una acción destructiva: el botón de confirmar es rojo y se bloquea mientras se ejecuta.
export function ConfirmDialog({ title, message, confirmLabel, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel} title={title}>
      <p className="text-sm leading-6 text-slate-400">{message}</p>
      <div className="flex justify-end gap-2 pt-6">
        <button className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50" disabled={busy} onClick={onCancel} type="button">Cancelar</button>
        <button className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={onConfirm} type="button">{confirmLabel}</button>
      </div>
    </Modal>
  )
}
