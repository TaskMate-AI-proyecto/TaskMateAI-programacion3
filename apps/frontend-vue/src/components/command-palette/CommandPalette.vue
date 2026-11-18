<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getFriends } from '../../api/friendsApi'
import { getApiErrorMessage } from '../../api/errors'
import { getTasks, toggleTaskStatus } from '../../api/tasksApi'
import { flattenGroups, moveActiveIndex, searchCommands } from '../../command-palette/commandSearch'
import { friendEntries, taskEntries, workspaceEntries, type PaletteEntry } from '../../command-palette/paletteEntries'
import { useTaskSyncStore } from '../../stores/taskSync'
import { useToastStore } from '../../stores/toast'
import { useWorkspacesStore } from '../../stores/workspaces'
import type { Friend, Task } from '../../types/api'

// Paleta de comandos: modal con Teleport, búsqueda agrupada y navegación con el teclado.
const props = defineProps<{ entries: PaletteEntry[] }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const taskSync = useTaskSyncStore()
const toast = useToastStore()
const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const tasks = ref<Task[]>([])
const friends = ref<Friend[]>([])
const loading = ref(true)
let previousFocus: HTMLElement | null = null

const listId = 'command-palette-list'

function optionId(index: number) {
  return `command-option-${index}`
}

function arrowStep(key: string): 1 | -1 | 0 {
  if (key === 'ArrowDown') return 1
  if (key === 'ArrowUp') return -1

  return 0
}

// Tareas y amigos se piden al abrir la paleta: siempre reflejan el estado actual.
async function loadLiveData() {
  const [loadedTasks, loadedFriends] = await Promise.all([
    getTasks().catch(() => [] as Task[]),
    getFriends().catch(() => [] as Friend[]),
  ])

  tasks.value = loadedTasks
  friends.value = loadedFriends
  loading.value = false
}

async function completeTask(task: Task) {
  try {
    await toggleTaskStatus(task)
    taskSync.notifyTasksChanged()
    toast.notify(task.status === 'COMPLETED' ? 'Tarea reabierta' : 'Tarea completada')
  } catch (error) {
    toast.notify(getApiErrorMessage(error), 'error')
  }
}

const workspaces = useWorkspacesStore()

const allEntries = computed<PaletteEntry[]>(() => [
  ...props.entries,
  ...workspaceEntries(workspaces.workspaces, (id) => workspaces.select(id)),
  ...taskEntries(tasks.value, {
    open: (task) => void router.push(`/tasks?tarea=${task.id}`),
    toggle: (task) => void completeTask(task),
  }),
  ...friendEntries(friends.value, (friendId) => void router.push(`/messages?contacto=${friendId}`)),
])

const groups = computed(() => searchCommands(allEntries.value, query.value))
const flat = computed(() => flattenGroups(groups.value))
const active = computed(() => (flat.value.length === 0 ? -1 : Math.min(activeIndex.value, flat.value.length - 1)))
const activeDescendant = computed(() => (active.value >= 0 ? optionId(active.value) : undefined))

function indexOf(item: PaletteEntry) {
  return flat.value.indexOf(item)
}

// Al ejecutar un comando la paleta se cierra primero; después corre la acción.
function runEntry(entry: PaletteEntry) {
  emit('close')
  entry.run()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    const entry = flat.value[active.value]
    if (entry) runEntry(entry)
    return
  }

  const step = arrowStep(event.key)
  if (step !== 0) {
    event.preventDefault()
    activeIndex.value = moveActiveIndex(active.value, flat.value.length, step)
  }
}

function handleOverlayMouseDown(event: MouseEvent) {
  if (event.target === event.currentTarget) emit('close')
}

// Al cambiar la consulta, la primera coincidencia vuelve a ser la activa.
watch(query, () => {
  activeIndex.value = 0
})

// Mantiene a la vista con la opción activa dentro del área de scroll.
watch(active, (index) => {
  if (index >= 0) document.getElementById(optionId(index))?.scrollIntoView?.({ block: 'nearest' })
})

onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  inputRef.value?.focus()
  void loadLiveData()
})

onBeforeUnmount(() => previousFocus?.focus())
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]" @mousedown="handleOverlayMouseDown">
      <div
        aria-label="Paleta de comandos"
        aria-modal="true"
        class="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        role="dialog"
      >
        <div class="flex items-center gap-3 border-b border-glass/10 px-4">
          <Search aria-hidden class="shrink-0 text-slate-400" :size="18" />
          <input
            ref="inputRef"
            v-model="query"
            :aria-activedescendant="activeDescendant"
            aria-autocomplete="list"
            :aria-controls="listId"
            aria-expanded="true"
            aria-label="Buscar comandos, tareas o amigos"
            autocomplete="off"
            class="h-14 min-w-0 flex-1 bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
            placeholder="Buscar comandos, tareas o amigos…"
            role="combobox"
            spellcheck="false"
            type="text"
            @keydown="handleKeyDown"
          />
          <kbd class="hidden rounded border border-glass/15 px-1.5 py-0.5 font-mono text-[11px] text-slate-400 sm:inline">Esc</kbd>
        </div>

        <div :id="listId" aria-label="Resultados" class="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          <p v-if="groups.length === 0" class="px-3 py-6 text-center text-sm text-slate-400">Sin resultados para «{{ query }}»</p>

          <div v-for="group in groups" :key="group.category" :aria-label="group.category" role="group">
            <p aria-hidden class="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{{ group.category }}</p>
            <div
              v-for="item in group.items"
              :id="optionId(indexOf(item))"
              :key="item.id"
              :aria-selected="indexOf(item) === active"
              :class="indexOf(item) === active ? 'bg-indigo-500/20 text-slate-100 ring-1 ring-indigo-400/40' : 'text-slate-300 hover:bg-glass/5'"
              class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
              role="option"
              @click="runEntry(item)"
              @mousedown.prevent
              @mouseenter="activeIndex = indexOf(item)"
            >
              <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <span v-if="item.hint" class="shrink-0 text-xs text-slate-400">{{ item.hint }}</span>
              <span v-if="item.shortcut" class="flex shrink-0 gap-1">
                <kbd v-for="key in item.shortcut.split(' ')" :key="key" class="rounded border border-glass/15 px-1.5 py-0.5 font-mono text-[11px] text-slate-400">{{ key }}</kbd>
              </span>
            </div>
          </div>
        </div>

        <footer class="flex items-center justify-between gap-3 border-t border-glass/10 px-4 py-2 text-xs text-slate-500">
          <span>{{ loading ? 'Cargando tareas y amigos…' : '' }}</span>
          <span>↑↓ navegar · ↵ abrir · Esc cerrar</span>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
