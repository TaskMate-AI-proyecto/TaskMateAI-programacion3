export interface Suggestion {
  text: string
  selected: boolean
}

export function toSuggestions(subtasks: string[]): Suggestion[] {
  return subtasks.map((text) => ({ text, selected: true }))
}

export function patchSuggestion(list: Suggestion[], index: number, changes: Partial<Suggestion>) {
  return list.map((item, position) => (position === index ? { ...item, ...changes } : item))
}

export function removeSuggestion(list: Suggestion[], index: number) {
  return list.filter((_, position) => position !== index)
}

export function selectedTexts(list: Suggestion[]) {
  return list.filter((item) => item.selected && item.text.trim()).map((item) => item.text.trim())
}
