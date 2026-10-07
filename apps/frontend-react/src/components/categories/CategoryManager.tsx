import { useState, type FormEvent } from 'react'
import { Pencil, Tags, Trash2 } from 'lucide-react'
import { createCategory, deleteCategory, updateCategory } from '../../api/categoriesApi'
import { getApiErrorMessage } from '../../api/errors'
import { useToast } from '../../hooks/useToast'
import type { Category } from '../../types/api'
import { fieldClass } from '../tasks/taskUtils'
import { Modal } from '../ui/Modal'

interface CategoryManagerProps {
  categories: Category[]
  onChanged: () => void
  onClose: () => void
}

const palette = ['#EF6F5E', '#4B9B84', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280']

export function CategoryManager({ categories, onChanged, onClose }: CategoryManagerProps) {
  const { notify } = useToast()
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(palette[0].toLowerCase())
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function resetForm() {
    setEditing(null)
    setName('')
    setColor(palette[0].toLowerCase())
  }

  function startEditing(category: Category) {
    setEditing(category)
    setName(category.name)
    setColor(category.color.toLowerCase())
    setConfirmId(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), color })
        notify('Categoría actualizada')
      } else {
        await createCategory({ name: name.trim(), color })
        notify('Categoría creada')
      }
      resetForm()
      onChanged()
    } catch (error) {
      notify(getApiErrorMessage(error), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(category: Category) {
    setIsSaving(true)
    try {
      await deleteCategory(category.id)
      notify('Categoría eliminada')
      if (editing?.id === category.id) resetForm()
      setConfirmId(null)
      onChanged()
    } catch (error) {
      notify(getApiErrorMessage(error, 'No se pudo eliminar. Si tiene tareas asociadas, reasígnalas primero.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Categorías">
      {categories.length === 0 ? (
        <div className="empty-state mb-5 min-h-32 rounded-md"><Tags size={24} /><p className="text-sm">Todavía no hay categorías. Crea una abajo.</p></div>
      ) : (
        <ul className="mb-5 space-y-2">
          {categories.map((category) => (
            <li className="flex items-center gap-3 rounded-md border border-ink/10 bg-white px-3 py-2" key={category.id}>
              <span aria-hidden className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
              {confirmId === category.id ? (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-ink/60">¿Eliminar?</span>
                  <button className="rounded-md bg-coral px-2 py-1 font-semibold text-white disabled:opacity-50" disabled={isSaving} onClick={() => void handleDelete(category)} type="button">Sí</button>
                  <button className="rounded-md px-2 py-1 font-semibold text-ink/70 hover:bg-ink/5" onClick={() => setConfirmId(null)} type="button">No</button>
                </div>
              ) : (
                <>
                  <button aria-label={`Editar ${category.name}`} className="inline-grid h-8 w-8 place-items-center rounded-md text-ink/60 hover:bg-ink/5" onClick={() => startEditing(category)} type="button"><Pencil size={15} /></button>
                  <button aria-label={`Eliminar ${category.name}`} className="inline-grid h-8 w-8 place-items-center rounded-md text-ink/60 hover:bg-ink/5" onClick={() => setConfirmId(category.id)} type="button"><Trash2 size={15} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form className="space-y-3 border-t border-ink/10 pt-4" onSubmit={(event) => void handleSubmit(event)}>
        <h3 className="text-sm font-semibold">{editing ? 'Editar categoría' : 'Nueva categoría'}</h3>
        <label className="block text-sm font-medium">Nombre
          <input className={fieldClass} maxLength={40} onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {palette.map((swatch) => (
            <button aria-label={`Color ${swatch}`} aria-pressed={color === swatch.toLowerCase()} className={`h-7 w-7 rounded-full border-2 ${color === swatch.toLowerCase() ? 'border-ink' : 'border-transparent'}`} key={swatch} onClick={() => setColor(swatch.toLowerCase())} style={{ backgroundColor: swatch }} type="button" />
          ))}
          <input aria-label="Color personalizado" className="h-7 w-10 cursor-pointer rounded border border-ink/20 bg-white" onChange={(event) => setColor(event.target.value)} type="color" value={color} />
        </div>
        <div className="flex justify-end gap-2">
          {editing && <button className="rounded-md px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5" onClick={resetForm} type="button">Cancelar edición</button>}
          <button className="command-button disabled:opacity-60" disabled={isSaving || !name.trim()} type="submit">{isSaving ? 'Guardando...' : editing ? 'Guardar' : 'Crear categoría'}</button>
        </div>
      </form>
    </Modal>
  )
}
