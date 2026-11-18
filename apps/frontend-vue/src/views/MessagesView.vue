<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import ChannelList from '../components/messages/ChannelList.vue'
import ChannelPane from '../components/messages/ChannelPane.vue'
import ConversationPane from '../components/messages/ConversationPane.vue'
import ContactList from '../components/messages/ContactList.vue'
import { useMessages } from '../composables/useMessages'
import { useWorkspacesStore } from '../stores/workspaces'

// Mensajería en un layout dividido: canales de espacios y contactos a la izquierda, y la conversación a la derecha.
const { contacts, selectedId, messages, error, meId, refreshing, refresh, selectContact, send } = useMessages()
const route = useRoute()
const router = useRouter()
const workspaces = useWorkspacesStore()
const draft = ref('')
const sending = ref(false)
const selected = computed(() => contacts.value.find((contact) => contact.id === selectedId.value) ?? null)

// Modo directo: se activa al abrir un contacto y dura hasta que cambie el espacio seleccionado.
const directFrom = ref<{ workspaceId: string | null } | null>(null)
const directMode = computed(() => directFrom.value !== null && directFrom.value.workspaceId === workspaces.selectedId)
const activeChannel = computed(() => {
  if (directMode.value) return null

  return workspaces.workspaces.find((workspace) => workspace.id === workspaces.selectedId) ?? null
})

function chooseContact(userId: string) {
  directFrom.value = { workspaceId: workspaces.selectedId }
  selectContact(userId)
}

function chooseChannel(workspaceId: string) {
  directFrom.value = null
  workspaces.select(workspaceId)
}

// La paleta de comandos abre una conversación con ?contacto=<id>; el parámetro se retira al usarlo.
watch(
  () => route.query.contacto,
  (contactId) => {
    if (typeof contactId !== 'string') return

    chooseContact(contactId)
    void router.replace({ path: route.path })
  },
  { immediate: true },
)

async function submit() {
  const content = draft.value.trim()
  if (!content || !selected.value || sending.value) return

  sending.value = true
  const sentOk = await send(content)
  sending.value = false
  if (sentOk) draft.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Mensajes</p>
        <h1 class="font-display text-4xl font-semibold text-slate-100">Conversaciones directas.</h1>
        <p class="mt-2 max-w-lg text-slate-400">Escribe a tus amigos de TaskMate o al canal de tus espacios. La lista se actualiza sola cada pocos segundos.</p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-xl border border-glass/20 bg-glass/5 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-xl transition hover:bg-glass/10 disabled:opacity-60"
        :disabled="refreshing"
        type="button"
        @click="refresh"
      >
        <RefreshCw :class="refreshing ? 'animate-spin' : ''" :size="16" />Actualizar
      </button>
    </div>

    <div class="glass-card grid h-[min(70vh,640px)] min-h-[480px] overflow-hidden md:grid-cols-[280px_minmax(0,1fr)]">
      <div class="flex min-h-0 flex-col">
        <ChannelList :active-id="activeChannel?.id" :workspaces="workspaces.workspaces" @select="chooseChannel" />
        <ContactList :contacts="contacts" :selected-id="selectedId" @select="chooseContact" />
      </div>
      <ChannelPane v-if="activeChannel" :key="activeChannel.id" :me-id="meId" :workspace="activeChannel" />
      <ConversationPane
        v-else
        :contact="selected"
        :draft="draft"
        :error="error"
        :messages="messages"
        :me-id="meId"
        :sending="sending"
        @submit="submit"
        @update:draft="draft = $event"
      />
    </div>
  </div>
</template>
