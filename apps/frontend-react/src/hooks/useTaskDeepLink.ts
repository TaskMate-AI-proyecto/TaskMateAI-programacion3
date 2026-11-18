import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Task } from '../types/api'

// Qué formulario abrir según los parámetros: null si la tarea pedida no existe en el listado.
function requestedForm(tasks: Task[], taskId: string | null, wantsNew: boolean): { task: Task | null } | null {
  if (wantsNew) return { task: null }

  const target = tasks.find((task) => task.id === taskId)

  return target ? { task: target } : null
}

// La paleta de comandos llega con ?tarea=<id> (abrir esa tarea) o ?nueva=1 (formulario de nueva tarea).
// Cuando el listado está listo se abre el formulario y el parámetro se retira de la URL.
export function useTaskDeepLink(tasks: Task[], isLoading: boolean, openForm: (task: Task | null) => void) {
  const [params, setParams] = useSearchParams()
  const taskId = params.get('tarea')
  const wantsNew = params.get('nueva') === '1'

  useEffect(() => {
    if (isLoading || (!taskId && !wantsNew)) return

    const form = requestedForm(tasks, taskId, wantsNew)
    if (form) openForm(form.task)
    setParams({}, { replace: true })
  }, [isLoading, taskId, wantsNew, tasks, openForm, setParams])
}
