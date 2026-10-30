import { useContext, useEffect, useRef } from 'react'
import { TaskSyncContext } from '../context/taskSyncContext'

export function useTaskSync() {
  return useContext(TaskSyncContext)
}

// Vuelve a pedir la consulta de tareas cada vez que cambian (el montaje inicial no cuenta).
export function useRefreshOnTaskChanges(refresh: () => void) {
  const { version } = useTaskSync()
  const seen = useRef(version)

  useEffect(() => {
    if (seen.current === version) return

    seen.current = version
    refresh()
  }, [version, refresh])
}
