interface ConfirmDeleteProps {
  isBusy: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDelete({ isBusy, onConfirm, onCancel }: ConfirmDeleteProps) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-ink/60">¿Eliminar?</span>
      <button className="rounded-md bg-coral px-2 py-1 font-semibold text-white disabled:opacity-50" disabled={isBusy} onClick={onConfirm} type="button">Sí</button>
      <button className="rounded-md px-2 py-1 font-semibold text-ink/70 hover:bg-ink/5" onClick={onCancel} type="button">No</button>
    </div>
  )
}
