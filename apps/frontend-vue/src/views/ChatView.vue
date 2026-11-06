<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getTasks } from '../api/tasksApi'
import { getApiErrorMessage } from '../api/errors'
import ChatContextPanel from '../components/chat/ChatContextPanel.vue'
import ChatThreadList from '../components/chat/ChatThreadList.vue'
import ChatWindow from '../components/chat/ChatWindow.vue'
import { useChatThreads } from '../composables/useChatThreads'
import { useAuthStore } from '../stores/auth'
import { useTaskSyncStore } from '../stores/taskSync'
import { useToastStore } from '../stores/toast'
import type { Task } from '../types/api'

const auth = useAuthStore()
const taskSync = useTaskSyncStore()
const toast = useToastStore()
const { threads, active, activeId, search, isSending, setSearch, selectThread, startConversation, sendMessage } =
  useChatThreads()
const tasks = ref<Task[]>([])

const pendingTasks = computed(() => tasks.value.filter((task) => task.status !== 'COMPLETED'))

async function loadTasks() {
  try {
    tasks.value = await getTasks()
  } catch (error) {
    toast.notify(getApiErrorMessage(error, 'No se pudieron cargar las tareas.'), 'error')
  }
}

onMounted(loadTasks)
// El panel de contexto muestra lo que el asistente analiza: se actualiza cuando el asistente cambia tareas.
watch(() => taskSync.version, loadTasks)
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
    <ChatThreadList
      :active-id="activeId"
      :search="search"
      :threads="threads"
      @new="startConversation"
      @search="setSearch"
      @select="selectThread"
    />
    <ChatWindow :is-sending="isSending" :thread="active" @send="sendMessage" />
    <ChatContextPanel :email="auth.user?.email" :pending="pendingTasks" />
  </div>
</template>
