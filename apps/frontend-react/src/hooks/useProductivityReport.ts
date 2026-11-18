import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../api/errors'
import { requestProductivityReport } from '../api/productivityReportApi'
import { reportFileName, triggerDownload } from '../utils/download'

export type ReportStatus = 'idle' | 'loading' | 'ready' | 'error'

// Genera el reporte: muestra el estado de carga, descarga el PDF y deja la vista previa abierta.
export function useProductivityReport() {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<ReportStatus>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  // Cada generación tiene un número: si el usuario cierra o vuelve a pedir, la respuesta anterior se descarta.
  const runRef = useRef(0)
  const urlRef = useRef<string | null>(null)

  const releasePreview = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setPreviewUrl(null)
  }, [])

  const generate = useCallback(async () => {
    runRef.current += 1
    const run = runRef.current
    setStatus('loading')
    setErrorMessage('')

    try {
      const blob = await requestProductivityReport()
      if (run !== runRef.current) return

      releasePreview()
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setPreviewUrl(url)
      triggerDownload(url, reportFileName(new Date()))
      setStatus('ready')
    } catch (error) {
      if (run !== runRef.current) return

      setErrorMessage(getApiErrorMessage(error, 'No se pudo generar el reporte. Inténtalo de nuevo.'))
      setStatus('error')
    }
  }, [releasePreview])

  const open = useCallback(() => {
    setIsOpen(true)
    void generate()
  }, [generate])

  const close = useCallback(() => {
    runRef.current += 1
    setIsOpen(false)
    setStatus('idle')
    releasePreview()
  }, [releasePreview])

  useEffect(() => {
    return () => {
      runRef.current += 1
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  return { isOpen, status, previewUrl, errorMessage, open, close, retry: generate }
}

export type ProductivityReport = ReturnType<typeof useProductivityReport>
