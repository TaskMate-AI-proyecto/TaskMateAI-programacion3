import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTaskSyncStore } from './taskSync'

describe('taskSyncStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('empieza en la versión 0', () => {
    expect(useTaskSyncStore().version).toBe(0)
  })

  it('sube la versión cada vez que se avisa un cambio de tareas', () => {
    const sync = useTaskSyncStore()

    sync.notifyTasksChanged()
    sync.notifyTasksChanged()

    expect(sync.version).toBe(2)
  })
})
