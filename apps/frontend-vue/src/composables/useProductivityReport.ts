import { onUnmounted, ref } from 'vue'
import { getApiErrorMessage } from '../api/errors'
import { requestProductivityReport } from '../api/productivityReportApi'
import { reportFileName, triggerDownload } from '../utils/download'

export type ReportStatus = 'idle' | 'loading' | 'ready' | 'error'

// Genera el reporte: muestra el estado de carga, descarga el PDF y deja la vista previa abierta.
export function useProductivityReport() {
  const isOpen = ref(false)
  const status = ref<ReportStatus>('idle')
  const previewUrl = ref<string | null>(null)
  const errorMessage = ref('')
  // Cada generación tiene un número: si el usuario cierra o vuelve a pedir, la respuesta anterior se descarta.
  let run = 0
  let objectUrl: string | null = null

  function releasePreview() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = null
    previewUrl.value = null
  }

  async function generate() {
    run += 1
    const current = run
    status.value = 'loading'
    errorMessage.value = ''

    try {
      const blob = await requestProductivityReport()
      if (current !== run) return

      releasePreview()
      objectUrl = URL.createObjectURL(blob)
      previewUrl.value = objectUrl
      triggerDownload(objectUrl, reportFileName(new Date()))
      status.value = 'ready'
    } catch (error) {
      if (current !== run) return

      errorMessage.value = getApiErrorMessage(error, 'No se pudo generar el reporte. Inténtalo de nuevo.')
      status.value = 'error'
    }
  }

  function open() {
    isOpen.value = true
    void generate()
  }

  function close() {
    run += 1
    isOpen.value = false
    status.value = 'idle'
    releasePreview()
  }

  onUnmounted(() => {
    run += 1
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  })

  return { isOpen, status, previewUrl, errorMessage, open, close, retry: generate }
}
