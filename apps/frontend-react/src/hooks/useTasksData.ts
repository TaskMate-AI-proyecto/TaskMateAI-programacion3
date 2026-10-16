import { getCategories } from '../api/categoriesApi'
import { getApiErrorMessage } from '../api/errors'
import { getTasks } from '../api/tasksApi'
import type { Task } from '../types/api'
import { useAsyncData } from './useAsyncData'

const describeError = (error: unknown) => getApiErrorMessage(error, 'No se pudieron cargar las tareas.')

async function loadTasksAndCategories(categoryId: string) {
  const [tasks, categories] = await Promise.all([getTasks({ categoryId: categoryId || undefined }), getCategories()])

  return { tasks, categories }
}

export function useTasksData(categoryId: string) {
  const { data, error, isLoading, setData, refresh, reload } = useAsyncData(() => loadTasksAndCategories(categoryId), categoryId, { describeError })

  function updateTasks(change: (list: Task[]) => Task[]) {
    setData((current) => current && { ...current, tasks: change(current.tasks) })
  }

  return { tasks: data?.tasks ?? [], categories: data?.categories ?? [], error, isLoading, updateTasks, refresh, reload }
}
