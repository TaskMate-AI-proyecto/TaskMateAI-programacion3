export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

export function toOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}

export function withEmptyOption<T extends string>(label: string, options: SelectOption<T>[]): SelectOption<T | ''>[] {
  return [{ value: '', label }, ...options]
}
