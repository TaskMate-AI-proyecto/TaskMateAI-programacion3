import { computed, ref, type Ref } from 'vue'
import { getTasks, toggleTaskStatus } from '../api/tasksApi'
import { getCategories } from '../api/categoriesApi'
import { getApiErrorMessage } from '../api/errors'
import type { Category, Task, TaskPriority } from '../types/api'

export type PriorityFilter = TaskPriority | 'ALL'

// El filtro de categoría es opcional y reactivo: cuando cambia, la siguiente carga pide sólo esas tareas.
// El espacio activo también es reactivo: cambiarlo cambia la siguiente carga (cadena vacía = todos).
export function useTasksData(categoryId: Readonly<Ref<string>> = ref(''), workspaceId: Readonly<Ref<string>> = ref('')) {
  const tasks = ref<Task[]>([])
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Trae tareas y categorías sin tocar el estado de carga: lo usa el sondeo para no mostrar esqueletos.
  async function refresh() {
    try {
      const [loadedTasks, loadedCategories] = await Promise.all([
        getTasks({ categoryId: categoryId.value || undefined, workspaceId: workspaceId.value || undefined }),
        getCategories(),
      ])
      tasks.value = loadedTasks
      categories.value = loadedCategories
      error.value = null
    } catch (err) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar las tareas.')
    }
  }

  async function loadAll() {
    isLoading.value = true
    await refresh()
    isLoading.value = false
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
    refresh,
    updateTasks,
    handleToggle,
  }
}
