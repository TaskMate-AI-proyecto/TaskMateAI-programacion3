import { computed, ref } from 'vue'
import { getTasks, toggleTaskStatus } from '../api/tasksApi'
import { getCategories } from '../api/categoriesApi'
import { getApiErrorMessage } from '../api/errors'
import type { Category, Task, TaskPriority } from '../types/api'

export type PriorityFilter = TaskPriority | 'ALL'

export function useTasksData() {
  const tasks = ref<Task[]>([])
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadAll() {
    isLoading.value = true
    error.value = null

    try {
      const [loadedTasks, loadedCategories] = await Promise.all([getTasks(), getCategories()])
      tasks.value = loadedTasks
      categories.value = loadedCategories
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar las tareas.')
    } finally {
      isLoading.value = false
    }
  }

  function updateTasks(fn: (tasks: Task[]) => Task[]) {
    tasks.value = fn(tasks.value)
  }

  async function handleToggle(task: Task) {
    try {
      const updated = await toggleTaskStatus(task)
      updateTasks((list) => list.map((item) => (item.id === updated.id ? updated : item)))
      return updated
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudo actualizar la tarea.')
      throw err
    }
  }

  return {
    tasks: computed(() => tasks.value),
    categories: computed(() => categories.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    loadAll,
    updateTasks,
    handleToggle,
  }
}
