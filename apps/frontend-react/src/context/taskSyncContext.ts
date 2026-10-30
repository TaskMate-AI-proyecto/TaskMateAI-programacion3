import { createContext } from 'react'

export interface TaskSyncContextValue {
  // Cambia cada vez que una acción del asistente modifica tareas; las vistas la usan para refrescarse.
  version: number
  notifyTasksChanged: () => void
}

// Sin proveedor (por ejemplo en tests aislados) notificar no hace nada.
export const TaskSyncContext = createContext<TaskSyncContextValue>({
  version: 0,
  notifyTasksChanged: () => {},
})
