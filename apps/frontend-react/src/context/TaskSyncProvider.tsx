import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { TaskSyncContext, type TaskSyncContextValue } from './taskSyncContext'

export function TaskSyncProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const notifyTasksChanged = useCallback(() => setVersion((current) => current + 1), [])
  const value = useMemo<TaskSyncContextValue>(() => ({ version, notifyTasksChanged }), [version, notifyTasksChanged])

  return <TaskSyncContext value={value}>{children}</TaskSyncContext>
}
