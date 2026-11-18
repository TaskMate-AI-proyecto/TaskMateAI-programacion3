import { FileText } from 'lucide-react'
import { useProductivityReport } from '../../hooks/useProductivityReport'
import { ProductivityReportModal } from './ProductivityReportModal'

const buttonClass = 'inline-flex items-center gap-2 rounded-xl border border-glass/20 bg-glass/10 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-xl transition hover:bg-glass/20 hover:shadow-[0_0_20px_-6px_rgba(139,92,246,0.7)]'

// Botón glassy "Exportar Reporte PDF" con su modal de vista previa.
export function ProductivityReportExport() {
  const report = useProductivityReport()

  return (
    <>
      <button className={buttonClass} onClick={report.open} type="button">
        <FileText aria-hidden size={16} />
        Exportar Reporte PDF
      </button>
      {report.isOpen && <ProductivityReportModal report={report} />}
    </>
  )
}
