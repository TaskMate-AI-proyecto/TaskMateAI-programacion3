import { fieldClass } from './fieldClass'
import type { SelectOption } from './selectOptions'

interface SelectFieldProps<T extends string> {
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  hideLabel?: boolean
}

export function SelectField<T extends string>({ label, value, options, onChange, hideLabel = false }: SelectFieldProps<T>) {
  return (
    <label className="block text-sm font-medium">
      {hideLabel ? <span className="sr-only">{label}</span> : label}
      <select className={hideLabel ? `${fieldClass} !mt-0` : fieldClass} onChange={(event) => onChange(event.target.value as T)} value={value}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}
