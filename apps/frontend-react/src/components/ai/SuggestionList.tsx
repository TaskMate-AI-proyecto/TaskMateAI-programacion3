import { Plus, X } from 'lucide-react'
import { patchSuggestion, removeSuggestion, selectedTexts, type Suggestion } from './suggestions'

interface SuggestionListProps {
  suggestions: Suggestion[]
  onChange: (suggestions: Suggestion[]) => void
  onAccept: () => void
}

export function SuggestionList({ suggestions, onChange, onAccept }: SuggestionListProps) {
  const selectedCount = selectedTexts(suggestions).length

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {suggestions.map((item, index) => (
          <li className="flex items-center gap-2" key={index}>
            <input aria-label={`Incluir subtarea ${index + 1}`} checked={item.selected} className="h-4 w-4 shrink-0 accent-indigo-500"onChange={(event) => onChange(patchSuggestion(suggestions, index, { selected: event.target.checked }))} type="checkbox" />
            <input aria-label={`Subtarea ${index + 1}`} className="min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-500"onChange={(event) => onChange(patchSuggestion(suggestions, index, { text: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }} value={item.text} />
            <button aria-label={`Descartar subtarea ${index + 1}`} className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-800"onClick={() => onChange(removeSuggestion(suggestions, index))} type="button"><X size={15} /></button>
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        <button className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"onClick={() => onChange([])} type="button">Descartar</button>
        <button className="command-button disabled:opacity-60" disabled={selectedCount === 0} onClick={onAccept} type="button"><Plus size={15} />Agregar {selectedCount} a la tarea</button>
      </div>
    </div>
  )
}
