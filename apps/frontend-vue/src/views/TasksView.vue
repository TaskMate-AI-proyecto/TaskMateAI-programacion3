<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Plus, Tags } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { createTask, deleteTask, toggleTaskStatus, updateTask } from '../api/tasksApi'
import { getApiErrorMessage } from '../api/errors'
import { useTasksData } from '../composables/useTasksData'
import { useTaskSyncStore } from '../stores/taskSync'
import { useWorkspacesStore } from '../stores/workspaces'
import { usePolling } from '../composables/usePolling'
import { useToastStore } from '../stores/toast'
import { useRewardNotifier } from '../composables/useRewardNotifier'
import type { Task, TaskInput } from '../types/api'
import { emptyFilters, filterTasks, hasActiveFilters, type TaskFilterState } from '../utils/taskUtils'
import CategoryManager from '../components/categories/CategoryManager.vue'
import DeleteTaskModal from '../components/tasks/DeleteTaskModal.vue'
import TaskFiltersBar from '../components/tasks/TaskFilters.vue'
import TaskList from '../components/tasks/TaskList.vue'
import TaskModal from '../components/tasks/TaskModal.vue'
import ErrorPanel from '../components/ui/ErrorPanel.vue'

// Un solo diálogo abierto a la vez, como en la página React.
type TaskDialog = { kind: 'form'; task: Task | null } | { kind: 'delete'; task: Task } | { kind: 'categories' } | null

const toast = useToastStore()
const announceCompletion = useRewardNotifier()
const taskSync = useTaskSyncStore()
const route = useRoute()
const router = useRouter()

const filters = ref<TaskFilterState>({ ...emptyFilters })
const categoryId = computed(() => filters.value.categoryId)
const workspaces = useWorkspacesStore()
const workspaceId = computed(() => workspaces.selectedId ?? '')
const { tasks, categories, error, isLoading, updateTasks, loadAll, refresh } = useTasksData(categoryId, workspaceId)
// Las tareas compartidas por un amigo llegan sin recargar: se vuelven a pedir cada 5 s con la ventana visible.
usePolling(refresh, 5000)

const dialog = ref<TaskDialog>(null)
const isSaving = ref(false)
const pendingId = ref<string | null>(null)

const visibleTasks = computed(() => filterTasks(tasks.value, filters.value))
const filtersActive = computed(() => hasActiveFilters(filters.value))
const editingTask = computed(() => (dialog.value?.kind === 'form' ? dialog.value.task : null))

onMounted(loadAll)
// Si el asistente cambia tareas mientras la vista está abierta, el listado se vuelve a pedir.
watch(() => taskSync.version, () => loadAll())
// Con un filtro de categoría el listado depende del servidor: se vuelve a pedir al cambiarlo.
watch(categoryId, () => loadAll())
// Cambiar de espacio cambia el conjunto de tareas: se vuelve a pedir.
watch(workspaceId, () => loadAll())

// Qué diálogo abrir con los parámetros de la paleta; null si la tarea pedida ya no existe.
function dialogFromLink(list: Task[], taskId: string | null, wantsNew: boolean): TaskDialog {
  if (wantsNew) return { kind: 'form', task: null }

  const target = list.find((task) => task.id === taskId)

  return target ? { kind: 'form', task: target } : null
}

function linkedTaskId() {
  const value = route.query.tarea
  return typeof value === 'string' ? value : null
}

// Desde la paleta de comandos: ?tarea=<id> abre esa tarea y ?nueva=1 abre el formulario de nueva tarea.
// Se espera a que el listado termine de cargar y después se retira el parámetro de la URL.
function openFromLink() {
  const taskId = linkedTaskId()
  const wantsNew = route.query.nueva === '1'
  if (isLoading.value || (!taskId && !wantsNew)) return

  const next = dialogFromLink(tasks.value, taskId, wantsNew)
  if (next) dialog.value = next
  void router.replace({ path: '/tasks' })
}

watch([isLoading, () => route.query.tarea, () => route.query.nueva], openFromLink)

function openCreate() {
  dialog.value = { kind: 'form', task: null }
}

function openEdit(task: Task) {
  dialog.value = { kind: 'form', task }
}

function openDelete(task: Task) {
  dialog.value = { kind: 'delete', task }
}

function clearFilters() {
  filters.value = { ...emptyFilters }
}

function replaceTask(list: Task[], updated: Task) {
  return list.map((item) => (item.id === updated.id ? updated : item))
}

// Las tareas nuevas se crean en el espacio activo, si hay uno.
function saveTask(editing: Task | null, input: TaskInput, workspaceId: string) {
  return editing ? updateTask(editing.id, input) : createTask({ ...input, workspaceId: workspaceId || undefined })
}

// Con un filtro de categoría la tarea guardada puede dejar de pertenecer a la lista: se vuelve a pedir.
// Sin filtro se actualiza el estado local con la respuesta, sin recargar.
function applySaved(editing: Task | null, saved: Task) {
  if (categoryId.value) return loadAll()

  updateTasks((list) => (editing ? replaceTask(list, saved) : [saved, ...list]))
  return Promise.resolve()
}

async function handleSave(input: TaskInput) {
  const editing = editingTask.value
  isSaving.value = true

  try {
    const saved = await saveTask(editing, input, workspaceId.value)
    announceCompletion(saved)
    toast.notify(editing ? 'Tarea actualizada' : 'Tarea creada')
    dialog.value = null
    await applySaved(editing, saved)
  } catch (error) {
    toast.notify(getApiErrorMessage(error), 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleToggle(task: Task) {
  pendingId.value = task.id

  try {
    const updated = await toggleTaskStatus(task)
    announceCompletion(updated)
    updateTasks((list) => replaceTask(list, updated))
  } catch (error) {
    toast.notify(getApiErrorMessage(error), 'error')
  } finally {
    pendingId.value = null
  }
}

async function removeTask(task: Task) {
  pendingId.value = task.id

  try {
    await deleteTask(task.id)
    dialog.value = null
    updateTasks((list) => list.filter((item) => item.id !== task.id))
    toast.notify('Tarea eliminada')
  } catch (error) {
    toast.notify(getApiErrorMessage(error), 'error')
  } finally {
    pendingId.value = null
  }
}

function confirmDelete() {
  if (dialog.value?.kind === 'delete') void removeTask(dialog.value.task)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Tareas</p>
        <h1 class="font-display text-4xl font-semibold">Tu lista de trabajo.</h1>
      </div>
      <div class="flex gap-2">
        <button
          class="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-md hover:border-indigo-500/60"
          type="button"
          @click="dialog = { kind: 'categories' }"
        >
          <Tags :size="16" />Categorías
        </button>
        <button class="command-button" type="button" @click="openCreate"><Plus :size="16" />Nueva tarea</button>
      </div>
    </div>

    <TaskFiltersBar v-model="filters" :categories="categories" />

    <ErrorPanel v-if="error" :message="error" @retry="loadAll" />

    <TaskList
      v-else
      :has-filters="filtersActive"
      :is-loading="isLoading"
      :pending-id="pendingId"
      :tasks="visibleTasks"
      @clear-filters="clearFilters"
      @create="openCreate"
      @delete="openDelete"
      @edit="openEdit"
      @toggle="handleToggle"
    />

    <TaskModal
      v-if="dialog?.kind === 'form'"
      :categories="categories"
      :is-saving="isSaving"
      :task="dialog.task"
      @close="dialog = null"
      @submit="handleSave"
    />

    <DeleteTaskModal
      v-if="dialog?.kind === 'delete'"
      :is-deleting="pendingId === dialog.task.id"
      :task="dialog.task"
      @close="dialog = null"
      @confirm="confirmDelete"
    />

    <CategoryManager
      v-if="dialog?.kind === 'categories'"
      :categories="categories"
      @changed="loadAll"
      @close="dialog = null"
    />
  </div>
</template>
