import { useState } from 'react'
import { generateSubtasks } from '../../api/aiApi'
import { getAiErrorMessage } from '../../api/errors'
import { useProgressStep } from '../../hooks/useProgressStep'
import { useSafeAction } from '../../hooks/useSafeAction'
import { useToast } from '../../hooks/useToast'
import { GenerateButton, GenerationProgress } from './GenerateControls'
import { SuggestionList } from './SuggestionList'
import { selectedTexts, toSuggestions, type Suggestion } from './suggestions'

interface SubtaskGeneratorProps {
  taskId: string
  onAccept: (subtasks: string[]) => void
}

const progressMessages = ['Analizando la tarea...', 'Pensando los pasos...', 'Ordenando las subtareas...', 'Casi listo...']

export function SubtaskGenerator({ taskId, onAccept }: SubtaskGeneratorProps) {
  const { notify } = useToast()
  const runSafely = useSafeAction()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { step, reset } = useProgressStep(isLoading, progressMessages.length - 1)

  async function generate() {
    if (isLoading) return
    reset()
    setIsLoading(true)
    const result = await runSafely(() => generateSubtasks(taskId), getAiErrorMessage)
    if (result.ok) setSuggestions(toSuggestions(result.value))
    setIsLoading(false)
  }

  function accept() {
    const accepted = selectedTexts(suggestions)
    if (accepted.length === 0) return
    onAccept(accepted)
    setSuggestions([])
    notify('Subtareas añadidas a la descripción. Guarda la tarea para conservarlas.')
  }

  return (
    <div className="space-y-3 rounded-md border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Asistente de IA</p>
        <GenerateButton hasSuggestions={suggestions.length > 0} isLoading={isLoading} onClick={() => void generate()} />
      </div>
      {isLoading && <GenerationProgress message={progressMessages[step]} />}
      {!isLoading && suggestions.length > 0 && <SuggestionList onAccept={accept} onChange={setSuggestions} suggestions={suggestions} />}
    </div>
  )
}
