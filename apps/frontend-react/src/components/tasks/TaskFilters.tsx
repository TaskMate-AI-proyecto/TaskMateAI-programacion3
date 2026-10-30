import { Search } from 'lucide-react'
import type { Category } from '../../types/api'
import { fieldClass } from '../ui/fieldClass'
import { SelectField } from '../ui/SelectField'
import { priorityFilterOptions, statusFilterOptions, toCategoryOptions, type TaskFilterState } from './taskUtils'

interface TaskFiltersProps {
  filters: TaskFilterState
  categories: Category[]
  onChange: (changes: Partial<TaskFilterState>) => void
}

export function TaskFilters({ filters, categories, onChange }: TaskFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
      <label className="relative block">
        <span className="sr-only">Buscar tareas</span>
        <Search className="absolute left-3 top-1/2 mt-[3px] -translate-y-1/2 text-slate-500" size={16} />
        <input className={`${fieldClass} !mt-0 pl-9`} onChange={(event) => onChange({ search: event.target.value })} placeholder="Buscar por título o descripción" type="search" value={filters.search} />
      </label>
      <SelectField hideLabel label="Estado" onChange={(status) => onChange({ status })} options={statusFilterOptions} value={filters.status} />
      <SelectField hideLabel label="Categoría" onChange={(categoryId) => onChange({ categoryId })} options={toCategoryOptions(categories, 'Todas las categorías')} value={filters.categoryId} />
      <SelectField hideLabel label="Prioridad" onChange={(priority) => onChange({ priority })} options={priorityFilterOptions} value={filters.priority} />
    </div>
  )
}
