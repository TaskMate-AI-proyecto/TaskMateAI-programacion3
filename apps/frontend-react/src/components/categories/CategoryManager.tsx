import { useState } from 'react'
import { Pencil, Tags, Trash2 } from 'lucide-react'
import { createCategory, deleteCategory, updateCategory } from '../../api/categoriesApi'
import { getApiErrorMessage } from '../../api/errors'
import { useSafeAction } from '../../hooks/useSafeAction'
import { useToast } from '../../hooks/useToast'
import type { Category, CategoryInput } from '../../types/api'
import { ConfirmDelete } from '../ui/ConfirmDelete'
import { fieldClass } from '../ui/fieldClass'
import { Modal } from '../ui/Modal'

interface CategoryManagerProps {
  categories: Category[]
  onChanged: () => void
  onClose: () => void
}

const palette = ['#EF6F5E', '#4B9B84', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280']
const defaultColor = palette[0].toLowerCase()
const rowActionClass = 'inline-grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100'

function toCategoryForm(editing: Category | null): Required<CategoryInput> {
  if (!editing) return { name: '', color: defaultColor }

  return { name: editing.name, color: editing.color.toLowerCase() }
}

function submitLabel(isSaving: boolean, isEditing: boolean) {
  if (isSaving) return 'Guardando...'

  return isEditing ? 'Guardar' : 'Crear categoría'
}

interface CategoryRowProps {
  category: Category
  isBusy: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

function CategoryRow({ category, isBusy, onEdit, onDelete }: CategoryRowProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <li className="glass-card flex items-center gap-3 px-3 py-2">
      <span aria-hidden className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
      {confirming ? <ConfirmDelete isBusy={isBusy} onCancel={() => setConfirming(false)} onConfirm={() => onDelete(category)} /> : (
        <>
          <button aria-label={`Editar ${category.name}`} className={rowActionClass} onClick={() => onEdit(category)} type="button"><Pencil size={15} /></button>
          <button aria-label={`Eliminar ${category.name}`} className={rowActionClass} onClick={() => setConfirming(true)} type="button"><Trash2 size={15} /></button>
        </>
      )}
    </li>
  )
}

interface CategoryFormProps {
  editing: Category | null
  isSaving: boolean
  onSubmit: (input: Required<CategoryInput>) => void
  onCancel: () => void
}

function CategoryForm({ editing, isSaving, onSubmit, onCancel }: CategoryFormProps) {
  const [values, setValues] = useState(() => toCategoryForm(editing))

  return (
    <form className="space-y-3 border-t border-slate-800 pt-4" onSubmit={(event) => { event.preventDefault(); onSubmit({ name: values.name.trim(), color: values.color }) }}>
      <h3 className="text-sm font-semibold">{editing ? 'Editar categoría' : 'Nueva categoría'}</h3>
      <label className="block text-sm font-medium">Nombre
        <input className={fieldClass} maxLength={40} onChange={(event) => setValues({ ...values, name: event.target.value })} required value={values.name} />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {palette.map((swatch) => (
          <button aria-label={`Color ${swatch}`} aria-pressed={values.color === swatch.toLowerCase()} className={`h-7 w-7 rounded-full border-2 ${values.color === swatch.toLowerCase() ? 'border-slate-100' : 'border-transparent'}`} key={swatch} onClick={() => setValues({ ...values, color: swatch.toLowerCase() })} style={{ backgroundColor: swatch }} type="button" />
        ))}
        <input aria-label="Color personalizado" className="h-7 w-10 cursor-pointer rounded border border-slate-700 bg-slate-950" onChange={(event) => setValues({ ...values, color: event.target.value })} type="color" value={values.color} />
      </div>
      <div className="flex justify-end gap-2">
        {editing && <button className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800" onClick={onCancel} type="button">Cancelar edición</button>}
        <button className="command-button disabled:opacity-60" disabled={isSaving || !values.name.trim()} type="submit">{submitLabel(isSaving, editing !== null)}</button>
      </div>
    </form>
  )
}

export function CategoryManager({ categories, onChanged, onClose }: CategoryManagerProps) {
  const { notify } = useToast()
  const runSafely = useSafeAction()
  const [editing, setEditing] = useState<Category | null>(null)
  const [formVersion, setFormVersion] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  function resetForm() {
    setEditing(null)
    setFormVersion((version) => version + 1)
  }

  async function handleSubmit(input: Required<CategoryInput>) {
    setIsSaving(true)
    const result = await runSafely(() => (editing ? updateCategory(editing.id, input) : createCategory(input)))
    if (result.ok) {
      notify(editing ? 'Categoría actualizada' : 'Categoría creada')
      resetForm()
      onChanged()
    }
    setIsSaving(false)
  }

  async function handleDelete(category: Category) {
    setIsSaving(true)
    const result = await runSafely(() => deleteCategory(category.id), (error) => getApiErrorMessage(error, 'No se pudo eliminar. Si tiene tareas asociadas, reasígnalas primero.'))
    if (result.ok) {
      notify('Categoría eliminada')
      if (editing?.id === category.id) resetForm()
      onChanged()
    }
    setIsSaving(false)
  }

  return (
    <Modal onClose={onClose} title="Categorías">
      {categories.length === 0 ? (
        <div className="empty-state mb-5 min-h-32 rounded-md"><Tags size={24} /><p className="text-sm">Todavía no hay categorías. Crea una abajo.</p></div>
      ) : (
        <ul className="mb-5 space-y-2">
          {categories.map((category) => <CategoryRow category={category} isBusy={isSaving} key={category.id} onDelete={(item) => void handleDelete(item)} onEdit={setEditing} />)}
        </ul>
      )}
      <CategoryForm editing={editing} isSaving={isSaving} key={`${editing?.id ?? 'new'}-${formVersion}`} onCancel={resetForm} onSubmit={(input) => void handleSubmit(input)} />
    </Modal>
  )
}
