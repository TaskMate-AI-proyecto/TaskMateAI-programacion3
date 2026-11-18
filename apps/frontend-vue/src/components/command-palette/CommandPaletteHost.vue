<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { staticEntries } from '../../command-palette/paletteEntries'
import { hasModifier, hasOpenDialog, isEditableTarget, isPaletteShortcut, resolveKey } from '../../command-palette/shortcuts'
import { useProductivityReport } from '../../composables/useProductivityReport'
import { useTheme } from '../../composables/useTheme'
import { requestViewMode } from '../../composables/useViewMode'
import { useCommandPaletteStore } from '../../stores/commandPalette'
import FriendsModal from '../friends/FriendsModal.vue'
import ProductivityReportModal from '../reports/ProductivityReportModal.vue'
import CommandPalette from './CommandPalette.vue'

// Dueño de la paleta: escucha el atajo global y monta la paleta y los modales que sus comandos abren.
const router = useRouter()
const palette = useCommandPaletteStore()
const { toggle: toggleTheme } = useTheme()
const { isOpen: reportOpen, status, previewUrl, errorMessage, open: openReport, close: closeReport, retry } = useProductivityReport()
const friendsOpen = ref(false)

const entries = staticEntries({
  go: (path) => void router.push(path),
  openKanban: () => {
    requestViewMode('kanban')
    void router.push('/dashboard')
  },
  openFriends: () => {
    friendsOpen.value = true
  },
  newTask: () => void router.push({ path: '/tasks', query: { nueva: '1' } }),
  toggleTheme: () => toggleTheme(),
  exportReport: () => openReport(),
})

// Las letras sueltas no son atajos al escribir, con otra tecla pulsada o con otro diálogo abierto.
function isIgnoredKey(event: KeyboardEvent) {
  return event.repeat || isEditableTarget(event.target) || hasModifier(event) || hasOpenDialog()
}

let armedAt: number | null = null

function handleKeyDown(event: KeyboardEvent) {
  if (isPaletteShortcut(event)) {
    event.preventDefault()
    palette.toggle()
    return
  }
  if (isIgnoredKey(event)) return

  const step = resolveKey(armedAt, event.key, Date.now())
  armedAt = step.armedAt
  const entry = entries.find((item) => item.id === step.commandId)

  if (entry) {
    event.preventDefault()
    entry.run()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
  <CommandPalette v-if="palette.isOpen" :entries="entries" @close="palette.close()" />
  <FriendsModal v-if="friendsOpen" @close="friendsOpen = false" />
  <ProductivityReportModal
    v-if="reportOpen"
    :error-message="errorMessage"
    :preview-url="previewUrl"
    :status="status"
    @close="closeReport"
    @retry="retry"
  />
</template>
