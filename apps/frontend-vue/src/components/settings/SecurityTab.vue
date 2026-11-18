<script setup lang="ts">
import { ref } from 'vue'
import { Download } from 'lucide-vue-next'
import { deleteTask, getTasks } from '../../api/tasksApi'
import { getApiErrorMessage } from '../../api/errors'
import { useToastStore } from '../../stores/toast'
import { exportTasks, type ExportFormat } from '../../settings/exporters'
import type { Task } from '../../types/api'
import ConfirmDialog from './ConfirmDialog.vue'
import ProductivityReportExport from '../reports/ProductivityReportExport.vue'

// Seguridad y datos: exportación de las tareas y zona de peligro para borrarlas todas.
const toast = useToastStore()
const resetTasks = ref<Task[] | null>(null)
const busy = ref(false)

async function exportData(format: ExportFormat) {
  try {
    exportTasks(format, await getTasks())
    toast.notify(`Tareas exportadas en ${format.toUpperCase()}`)
  } catch (error) {
    toast.notify(getApiErrorMessage(error, 'No se pudieron exportar las tareas.'), 'error')
  }
}

async function askReset() {
  try {
    const tasks = await getTasks()
    if (tasks.length === 0) toast.notify('No tienes tareas que eliminar')
    else resetTasks.value = tasks
  } catch (error) {
    toast.notify(getApiErrorMessage(error, 'No se pudieron cargar las tareas.'), 'error')
  }
}

async function confirmReset() {
  if (!resetTasks.value) return

  busy.value = true
  try {
    await Promise.all(resetTasks.value.map((task) => deleteTask(task.id)))
    resetTasks.value = null
    toast.notify('Tareas eliminadas')
  } catch (error) {
    toast.notify(getApiErrorMessage(error, 'No se pudieron eliminar todas las tareas.'), 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="space-y-8">
    <div class="space-y-3 rounded-2xl border border-glass/10 bg-glass/5 p-5">
      <h2 class="font-semibold text-slate-100">Exportar tareas</h2>
      <p class="text-xs text-slate-400">Descarga una copia de tus tareas para guardarla o usarla en otra herramienta. El reporte PDF resume tu productividad con un análisis de Groq.</p>
      <div class="flex flex-wrap gap-2">
        <button class="inline-flex items-center gap-2 rounded-md border border-glass/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-glass/10" type="button" @click="exportData('json')">
          <Download :size="16" />JSON
        </button>
        <button class="inline-flex items-center gap-2 rounded-md border border-glass/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-glass/10" type="button" @click="exportData('csv')">
          <Download :size="16" />CSV
        </button>
        <ProductivityReportExport />
      </div>
    </div>

    <div class="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
      <h2 class="font-semibold text-red-700 dark:text-red-300">Zona de peligro</h2>
      <p class="text-sm text-slate-400">Elimina todas tus tareas de forma permanente. Tus categorías y tu cuenta se conservan.</p>
      <button class="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110" type="button" @click="askReset">
        Restablecer tareas
      </button>
    </div>

    <ConfirmDialog
      v-if="resetTasks"
      :busy="busy"
      confirm-label="Eliminar todo"
      :message="`Se eliminarán ${resetTasks.length} tareas. Esta acción no se puede deshacer.`"
      title="¿Restablecer todas las tareas?"
      @cancel="resetTasks = null"
      @confirm="confirmReset"
    />
  </section>
</template>
