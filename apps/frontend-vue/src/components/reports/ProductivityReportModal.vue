<script setup lang="ts">
import { Loader } from 'lucide-vue-next'
import { reportFileName, triggerDownload } from '../../utils/download'
import type { ReportStatus } from '../../composables/useProductivityReport'
import Modal from '../ui/Modal.vue'

// Modal de vista previa: spinner mientras Groq trabaja, luego el PDF y la descarga automática.
const props = defineProps<{ status: ReportStatus; previewUrl: string | null; errorMessage: string }>()
const emit = defineEmits<{ close: []; retry: [] }>()

function downloadAgain() {
  if (props.previewUrl) triggerDownload(props.previewUrl, reportFileName(new Date()))
}
</script>

<template>
  <Modal title="Vista previa del reporte" @close="emit('close')">
    <div v-if="status === 'loading'" class="flex flex-col items-center gap-4 py-12 text-center" role="status" aria-live="polite">
      <Loader aria-hidden class="h-10 w-10 animate-spin text-indigo-400" :size="40" />
      <p class="text-slate-300">Groq está analizando tu historial y preparando el PDF…</p>
    </div>

    <div v-else-if="status === 'error'" class="flex flex-col items-center gap-4 py-10 text-center">
      <p class="text-coral" role="alert">{{ errorMessage }}</p>
      <button class="command-button" type="button" @click="emit('retry')">Reintentar</button>
    </div>

    <div v-else-if="status === 'ready' && previewUrl" class="space-y-4">
      <iframe :src="previewUrl" class="h-[60vh] w-full rounded-xl border border-white/10 bg-white" title="Vista previa del reporte de productividad" />
      <div class="flex justify-end">
        <button class="command-button" type="button" @click="downloadAgain">Descargar de nuevo</button>
      </div>
    </div>
  </Modal>
</template>
