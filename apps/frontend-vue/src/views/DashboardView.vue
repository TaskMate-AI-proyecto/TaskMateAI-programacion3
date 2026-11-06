<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTasksData, type PriorityFilter } from '../composables/useTasksData'
import { createTask, updateTask, deleteTask } from '../api/tasksApi'
import type { Task, TaskInput } from '../types/api'
import DashboardTaskList from '../components/tasks/DashboardTaskList.vue'
import TaskModal from '../components/tasks/TaskModal.vue'
import DeleteTaskModal from '../components/tasks/DeleteTaskModal.vue'

const router = useRouter()
const auth = useAuthStore()

const { tasks, categories, isLoading, error, loadAll, updateTasks, handleToggle } = useTasksData()

const priority = ref<PriorityFilter>('ALL')
const dialog = ref<{ kind: 'form' | 'delete'; task?: Task } | null>(null)
const pendingId = ref<string | null>(null)
const isSaving = ref(false)

onMounted(() => {
  loadAll()
})

function logout() {
  auth.clearSession()
  void router.replace('/login')
}

async function handleSave(input: TaskInput) {
  const editing = dialog.value?.kind === 'form' ? dialog.value.task : null
  isSaving.value = true

  try {
    if (editing) {
      await updateTask(editing.id, input)
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
      <div class="flex items-center gap-3">
        <button
          :disabled="isLoading"
          aria-label="Actualizar"
          class="icon-button"
          title="Actualizar"
          type="button"
          @click="loadAll"
        >
          <RefreshCw :class="isLoading ? 'animate-spin' : ''" :size="18" />
        </button>
        <button
          aria-label="Cerrar sesión"
          class="icon-button"
          title="Cerrar sesión"
          type="button"
          @click="logout"
        >
          <span class="sr-only">Cerrar sesión</span>
        </button>
      </div>
    </div>

    <div v-if="error" class="rounded-2xl border border-coral/30 bg-coral/10 p-4 text-coral">
      <p class="text-sm">{{ error }}</p>
      <button class="text-link mt-2 text-sm" type="button" @click="loadAll">Reintentar</button>
    </div>

    <div v-else class="space-y-6">
      <div class="flex items-center gap-3">
        <button
          class="command-button rounded-2xl"
          type="button"
          @click="dialog = { kind: 'form', task: undefined }"
        >
          + Nueva tarea
        </button>
      </div>

      <DashboardTaskList
        :is-loading="isLoading"
        :pending-id="pendingId"
        :priority="priority"
        :tasks="tasks"
        @priority-change="priority = $event"
        @toggle="
          (task) => {
            pendingId = task.id
            handleToggle(task).finally(() => (pendingId = null))
          }
        "
      />
    </div>

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
