<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { useTasksData, type PriorityFilter } from '../composables/useTasksData'
import { createTask, updateTask, deleteTask } from '../api/tasksApi'
import { getApiErrorMessage } from '../api/errors'
import { useTaskSyncStore } from '../stores/taskSync'
import { useWorkspacesStore } from '../stores/workspaces'
import { useToastStore } from '../stores/toast'
import { useRewardNotifier } from '../composables/useRewardNotifier'
import { usePolling } from '../composables/usePolling'
import { useViewMode } from '../composables/useViewMode'
import type { Task, TaskInput, TaskStatus } from '../types/api'
import DailySummaryWidget from '../components/ai/DailySummaryWidget.vue'
import CategoryTiles from '../components/dashboard/CategoryTiles.vue'
import MetricCards from '../components/dashboard/MetricCards.vue'
import ProductivityChart from '../components/dashboard/ProductivityChart.vue'
import UpcomingTasks from '../components/dashboard/UpcomingTasks.vue'
import DashboardTaskList from '../components/tasks/DashboardTaskList.vue'
import TaskModal from '../components/tasks/TaskModal.vue'
import DeleteTaskModal from '../components/tasks/DeleteTaskModal.vue'
import ErrorPanel from '../components/ui/ErrorPanel.vue'
import ProductivityReportExport from '../components/reports/ProductivityReportExport.vue'

const taskSync = useTaskSyncStore()
const toast = useToastStore()
const announceCompletion = useRewardNotifier()
const { viewMode, setViewMode } = useViewMode()

// Con un espacio activo el panel solo cuenta sus tareas; cambiar de espacio vuelve a pedirlas.
const workspaces = useWorkspacesStore()
const workspaceId = computed(() => workspaces.selectedId ?? '')
const { tasks, categories, isLoading, error, loadAll, refresh, updateTasks, handleToggle } = useTasksData(undefined, workspaceId)
// Las tareas compartidas por un amigo llegan sin recargar: se vuelven a pedir cada 5 s con la ventana visible.
usePolling(refresh, 5000)

const priority = ref<PriorityFilter>('ALL')
const dialog = ref<{ kind: 'form' | 'delete'; task?: Task } | null>(null)
const pendingId = ref<string | null>(null)
const isSaving = ref(false)

onMounted(() => {
  loadAll()
})

// Si el asistente crea, edita o borra tareas, el listado se vuelve a pedir sin recargar la página.
watch(
  () => taskSync.version,
  () => loadAll(),
)
watch(workspaceId, () => loadAll())

function openCreate() {
  dialog.value = { kind: 'form', task: undefined }
}

async function onToggle(task: Task) {
  pendingId.value = task.id

  try {
    announceCompletion(await handleToggle(task))
  } catch {
    // El error ya queda en el estado de la vista (ErrorPanel).
  } finally {
    pendingId.value = null
  }
}

function replaceTask(updated: Task) {
  updateTasks((list) => list.map((item) => (item.id === updated.id ? updated : item)))
}

// Al soltar una tarjeta en otra columna se actualiza al instante (KPIs incluidos) y luego se guarda en la API.
// Si la API falla, la tarjeta vuelve a su columna original y se avisa.
async function handleMove(task: Task, status: TaskStatus) {
  pendingId.value = task.id
  replaceTask({ ...task, status })

  try {
    const updated = await updateTask(task.id, { status })
    replaceTask(updated)
    announceCompletion(updated)
  } catch (err) {
    replaceTask(task)
    toast.notify(getApiErrorMessage(err, 'No se pudo mover la tarea.'), 'error')
  } finally {
    pendingId.value = null
  }
}

async function handleSave(input: TaskInput) {
  const editing = dialog.value?.kind === 'form' ? dialog.value.task : null
  isSaving.value = true

  try {
    if (editing) {
      announceCompletion(await updateTask(editing.id, input))
    } else {
      const newTask = await createTask(input)
      updateTasks((list) => [newTask, ...list])
    }
    dialog.value = null
    await loadAll()
  } catch (err) {
    // Error already handled by API
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(task: Task) {
  isSaving.value = true

  try {
    await deleteTask(task.id)
    updateTasks((list) => list.filter((item) => item.id !== task.id))
    dialog.value = null
  } catch (err) {
    // Error already handled by API
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Espacio de trabajo</p>
        <h1 class="font-display text-4xl font-semibold text-slate-100">Hoy, con calma.</h1>
        <p class="mt-2 max-w-lg text-slate-400">Un vistazo a lo que tienes en marcha.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button class="command-button" type="button" @click="openCreate">+ Nueva tarea</button>
        <ProductivityReportExport />
        <button
          aria-label="Actualizar"
          class="icon-button"
          :disabled="isLoading"
          title="Actualizar"
          type="button"
          @click="loadAll"
        >
          <RefreshCw :class="isLoading ? 'animate-spin' : ''" :size="18" />
        </button>
      </div>
    </div>

    <DailySummaryWidget />

    <ErrorPanel v-if="error" :message="error" @retry="loadAll" />

    <template v-else>
      <MetricCards :is-loading="isLoading" :tasks="tasks" />

      <div class="grid gap-6 xl:grid-cols-3">
        <DashboardTaskList
          :is-loading="isLoading"
          :pending-id="pendingId"
          :priority="priority"
          :tasks="tasks"
          :view="viewMode"
          @move="handleMove"
          @priority-change="priority = $event"
          @toggle="onToggle"
          @view-change="setViewMode"
        />
        <div class="min-w-0 space-y-6 xl:col-span-1">
          <ProductivityChart :is-loading="isLoading" :tasks="tasks" />
          <CategoryTiles :categories="categories" :tasks="tasks" />
        </div>
      </div>

      <UpcomingTasks :is-loading="isLoading" :tasks="tasks" />
    </template>

    <TaskModal
      v-if="dialog?.kind === 'form'"
      :categories="categories"
      :is-saving="isSaving"
      :task="dialog.task ?? null"
      @close="dialog = null"
      @submit="handleSave"
    />

    <DeleteTaskModal
      v-if="dialog?.kind === 'delete' && dialog.task"
      :is-deleting="isSaving"
      :task="dialog.task"
      @close="dialog = null"
      @confirm="handleDelete(dialog.task!)"
    />
  </div>
</template>
