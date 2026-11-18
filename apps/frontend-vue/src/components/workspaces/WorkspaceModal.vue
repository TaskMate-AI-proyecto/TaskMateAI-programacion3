<script setup lang="ts">
import { computed, onMounted, ref, type Ref } from 'vue'
import { getFriends } from '../../api/friendsApi'
import { getApiErrorMessage } from '../../api/errors'
import { addWorkspaceMembers, createWorkspace } from '../../api/workspacesApi'
import { useToastStore } from '../../stores/toast'
import { useWorkspacesStore } from '../../stores/workspaces'
import type { Friend } from '../../types/api'
import Modal from '../ui/Modal.vue'

const emit = defineEmits<{ close: [] }>()

const workspaces = useWorkspacesStore()
const toast = useToastStore()
const friends = ref<Friend[]>([])
const colors = ['#6366F1', '#EF6F5E', '#4B9B84', '#F59E0B', '#EC4899']
// Glassy V5 del modal de espacios: vidrio claro en tema claro y oscuro translúcido en tema oscuro.
const glassyPanel = 'w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-6 text-slate-800 shadow-2xl backdrop-blur-2xl [&>div>h2]:font-bold [&>div>h2]:text-xl [&>div>h2]:!text-slate-900 dark:border-white/15 dark:bg-slate-900/95 dark:text-slate-100 dark:[&>div>h2]:!text-white'
const workspaceOverlay = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm'

const name = ref('')
const color = ref(colors[0])
const memberIds = ref<string[]>([])
const saving = ref(false)
const managedId = ref<string | null>(null)
const picked = ref<string[]>([])

const managed = computed(() => workspaces.workspaces.find((workspace) => workspace.id === managedId.value) ?? workspaces.workspaces[0])
const candidates = computed(() => {
  const existing = new Set(managed.value?.members.map((member) => member.id) ?? [])

  return friends.value.filter((item) => !existing.has(item.friend.id))
})

const selectedManagedId = computed({
  get: () => managedId.value ?? managed.value?.id ?? '',
  set: (id: string) => { managedId.value = id },
})

function toggleIn(list: Ref<string[]>, id: string) {
  list.value = list.value.includes(id) ? list.value.filter((item) => item !== id) : [...list.value, id]
}

function toggleMember(id: string) {
  toggleIn(memberIds, id)
}

function togglePick(id: string) {
  toggleIn(picked, id)
}

async function create() {
  if (!name.value.trim() || saving.value) return

  saving.value = true
  try {
    const created = await createWorkspace({ name: name.value.trim(), color: color.value, memberIds: memberIds.value })
    toast.notify('Espacio creado')
    await workspaces.load()
    workspaces.select(created.id)
    emit('close')
  } catch (error) {
    toast.notify(getApiErrorMessage(error, 'No se pudo crear el espacio.'), 'error')
  } finally {
    saving.value = false
  }
}

async function addMembers() {
  if (!managed.value || picked.value.length === 0) return

  try {
    const result = await addWorkspaceMembers(managed.value.id, picked.value)
    picked.value = []
    toast.notify(`Añadidos ${result.added} amigos`)
    await workspaces.load()
  } catch (error) {
    toast.notify(getApiErrorMessage(error, 'No se pudo añadir a los amigos.'), 'error')
  }
}

onMounted(async () => {
  try {
    friends.value = await getFriends()
  } catch {
    friends.value = []
  }
})
</script>

<template>
  <Teleport to="body">
    <Modal :overlay-class="workspaceOverlay" :panel-class="glassyPanel" title="Espacios" @close="emit('close')">
    <div class="space-y-6">
      <form class="space-y-3" @submit.prevent="create">
        <h3 class="!text-slate-700 dark:!text-slate-200 text-xs font-semibold">Nuevo espacio</h3>
        <input v-model="name" aria-label="Nombre del espacio" class="settings-field" maxlength="40" placeholder="Proyecto final" type="text" />
        <div aria-label="Color del espacio" class="flex items-center gap-2" role="group">
          <button
            v-for="item in colors"
            :key="item"
            :aria-label="`Color ${item}`"
            :aria-pressed="color === item"
            :class="['h-7 w-7 rounded-full border-2 transition', color === item ? 'scale-110 border-white ring-2 ring-slate-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-slate-900' : 'border-transparent']"
            :style="{ backgroundColor: item }"
            type="button"
            @click="color = item"
          />
        </div>
        <p class="!text-slate-700 dark:!text-slate-200 text-xs font-semibold">Invita amigos (opcional)</p>
        <ul v-if="friends.length > 0" class="max-h-40 space-y-1.5 overflow-y-auto">
          <li v-for="item in friends" :key="item.friend.id">
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-glass/10 bg-glass/5 px-3 py-2 !text-slate-900 text-sm font-medium dark:!text-slate-100">
              <input :checked="memberIds.includes(item.friend.id)" class="accent-indigo-500" type="checkbox" @change="toggleMember(item.friend.id)" />
              {{ item.friend.uniqueTag }}
            </label>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-600 dark:text-slate-400">No hay amigos para invitar.</p>
        <button :disabled="saving || !name.trim()" class="command-button w-full justify-center" type="submit">Crear espacio</button>
      </form>

      <section v-if="managed" class="mt-4 space-y-3 border-t border-slate-200/80 pt-4 dark:border-white/10">
        <h3 class="!text-slate-700 dark:!text-slate-200 text-xs font-semibold">Gestionar espacio</h3>
        <select v-model="selectedManagedId" aria-label="Espacio a gestionar" class="settings-field !bg-slate-100 !text-slate-900 dark:!bg-slate-800 dark:!text-white">
          <option v-for="workspace in workspaces.workspaces" :key="workspace.id" class="!bg-slate-100 !text-slate-900 dark:!bg-slate-800 dark:!text-white" :value="workspace.id">{{ workspace.name }}</option>
        </select>
        <ul v-if="candidates.length > 0" class="max-h-40 space-y-1.5 overflow-y-auto">
          <li v-for="item in candidates" :key="item.friend.id">
            <label class="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 !text-slate-900 text-sm font-medium transition hover:bg-slate-200/60 dark:!text-slate-100 dark:hover:bg-white/10">
              <input :checked="picked.includes(item.friend.id)" class="accent-indigo-500" type="checkbox" @change="togglePick(item.friend.id)" />
              {{ item.friend.uniqueTag }}
            </label>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-500 dark:text-slate-400">No hay más amigos para añadir.</p>
        <button :disabled="picked.length === 0" class="command-button w-full justify-center" type="button" @click="addMembers">Añadir amigos</button>
      </section>
    </div>
    </Modal>
  </Teleport>
</template>
