import { Loader } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { reportFileName, triggerDownload } from '../../utils/download'
import type { ProductivityReport } from '../../hooks/useProductivityReport'

function GeneratingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center" role="status" aria-live="polite">
      <Loader aria-hidden className="h-10 w-10 animate-spin text-indigo-400" size={40} />
      <p className="text-slate-300">Groq está analizando tu historial y preparando el PDF…</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="text-coral" role="alert">{message}</p>
      <button className="command-button" onClick={onRetry} type="button">Reintentar</button>
    </div>
  )
}

function PreviewState({ url }: { url: string }) {
  return (
    <div className="space-y-4">
      <iframe className="h-[60vh] w-full rounded-xl border border-white/10 bg-white" src={url} title="Vista previa del reporte de productividad" />
      <div className="flex justify-end">
        <button className="command-button" onClick={() => triggerDownload(url, reportFileName(new Date()))} type="button">Descargar de nuevo</button>
      </div>
    </div>
  )
}

// Modal de vista previa: spinner mientras Groq trabaja, luego el PDF y la descarga automática.
export function ProductivityReportModal({ report }: { report: ProductivityReport }) {
  return (
    <Modal onClose={report.close} title="Vista previa del reporte">
      {report.status === 'loading' && <GeneratingState />}
      {report.status === 'error' && <ErrorState message={report.errorMessage} onRetry={() => void report.retry()} />}
      {report.status === 'ready' && report.previewUrl && <PreviewState url={report.previewUrl} />}
    </Modal>
  )
}
