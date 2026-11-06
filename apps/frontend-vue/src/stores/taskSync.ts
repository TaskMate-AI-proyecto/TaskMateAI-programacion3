import { defineStore } from 'pinia'
import { ref } from 'vue'

// Cambia cada vez que una acción del asistente modifica tareas; las vistas la observan para volver a pedir el listado.
export const useTaskSyncStore = defineStore('taskSync', () => {
  const version = ref(0)

  function notifyTasksChanged() {
    version.value += 1
  }

  return { version, notifyTasksChanged }
})
