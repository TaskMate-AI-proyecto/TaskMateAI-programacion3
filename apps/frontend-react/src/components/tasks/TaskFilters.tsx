import { Search } from 'lucide-react'
import type { Category, TaskPriority, TaskStatus } from '../../types/api'
import { fieldClass, priorityLabels, statusLabels, type TaskFilterState } from './taskUtils'

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
        <Search className="absolute left-3 top-1/2 mt-[3px] -translate-y-1/2 text-ink/45" size={16} />
        <input className={`${fieldClass} !mt-0 pl-9`} onChange={(event) => onChange({ search: event.target.value })} placeholder="Buscar por título o descripción" type="search" value={filters.search} />
      </label>
      <label className="block"><span className="sr-only">Estado</span>
        <select className={`${fieldClass} !mt-0`} onChange={(event) => onChange({ status: event.target.value as TaskStatus | 'ALL' })} value={filters.status}>
          <option value="ALL">Todas</option>
          {(Object.keys(statusLabels) as TaskStatus[]).map((value) => <option key={value} value={value}>{statusLabels[value]}s</option>)}
        </select>
      </label>
      <label className="block"><span className="sr-only">Categoría</span>
        <select className={`${fieldClass} !mt-0`} onChange={(event) => onChange({ categoryId: event.target.value })} value={filters.categoryId}>
          <option value="">Todas las categorías</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="block"><span className="sr-only">Prioridad</span>
        <select className={`${fieldClass} !mt-0`} onChange={(event) => onChange({ priority: event.target.value as TaskPriority | 'ALL' })} value={filters.priority}>
          <option value="ALL">Cualquier prioridad</option>
          {(Object.keys(priorityLabels) as TaskPriority[]).map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}
        </select>
      </label>
    </div>
  )
}
