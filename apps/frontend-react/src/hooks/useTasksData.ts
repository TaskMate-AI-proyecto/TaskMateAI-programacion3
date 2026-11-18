import { getCategories } from '../api/categoriesApi'
import { getApiErrorMessage } from '../api/errors'
import { getTasks } from '../api/tasksApi'
import type { Task } from '../types/api'
import { workspaceQuery } from '../utils/workspaceQuery'
import { useAsyncData } from './useAsyncData'

const describeError = (error: unknown) => getApiErrorMessage(error, 'No se pudieron cargar las tareas.')

async function loadTasksAndCategories(categoryId: string, workspaceId: string) {
  const [tasks, categories] = await Promise.all([
    getTasks({ categoryId: categoryId || undefined, ...workspaceQuery(workspaceId) }),
    getCategories(),
  ])

  return { tasks, categories }
}

// El espacio activo ("" = todos) forma parte de la clave: cambiar de espacio vuelve a pedir las tareas.
export function useTasksData(categoryId: string, workspaceId: string) {
  const { data, error, isLoading, setData, refresh, reload } = useAsyncData(
    () => loadTasksAndCategories(categoryId, workspaceId),
    `${categoryId}|${workspaceId}`,
    { describeError },
  )

  function updateTasks(change: (list: Task[]) => Task[]) {
    setData((current) => current && { ...current, tasks: change(current.tasks) })
  }

  return { tasks: data?.tasks ?? [], categories: data?.categories ?? [], error, isLoading, updateTasks, refresh, reload }
}
