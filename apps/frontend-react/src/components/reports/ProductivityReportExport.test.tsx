import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestProductivityReport } from '../../api/productivityReportApi'
import { ProductivityReportExport } from './ProductivityReportExport'

vi.mock('../../api/productivityReportApi', () => ({ requestProductivityReport: vi.fn() }))

const requestMock = vi.mocked(requestProductivityReport)
const downloads: string[] = []

describe('ProductivityReportExport', () => {
  beforeEach(() => {
    downloads.length = 0
    URL.createObjectURL = vi.fn(() => 'blob:reporte')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clickMock(this: HTMLAnchorElement) {
      downloads.push(this.download)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    requestMock.mockReset()
  })

  it('muestra el spinner mientras se genera y después descarga el PDF y lo previsualiza', async () => {
    let finish: (blob: Blob) => void = () => undefined
    requestMock.mockReturnValue(new Promise<Blob>((resolve) => { finish = resolve }))
    const user = userEvent.setup()
    render(<ProductivityReportExport />)

    await user.click(screen.getByRole('button', { name: 'Exportar Reporte PDF' }))

    expect(screen.getByRole('dialog', { name: 'Vista previa del reporte' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Groq está analizando')
    finish(new Blob(['%PDF-1.4'], { type: 'application/pdf' }))
    expect(await screen.findByTitle('Vista previa del reporte de productividad')).toHaveAttribute('src', 'blob:reporte')
    expect(downloads).toHaveLength(1)
    expect(downloads[0]).toMatch(/^Reporte_Productividad_TaskMate_\d{4}-\d{2}-\d{2}\.pdf$/)
  })

  it('muestra el error con opción de reintentar', async () => {
    requestMock.mockRejectedValueOnce(new Error('caído')).mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
    const user = userEvent.setup()
    render(<ProductivityReportExport />)

    await user.click(screen.getByRole('button', { name: 'Exportar Reporte PDF' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo generar el reporte')

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByTitle('Vista previa del reporte de productividad')).toBeInTheDocument()
    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it('al cerrar el modal libera la vista previa', async () => {
    requestMock.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }))
    const user = userEvent.setup()
    render(<ProductivityReportExport />)
    await user.click(screen.getByRole('button', { name: 'Exportar Reporte PDF' }))
    await screen.findByTitle('Vista previa del reporte de productividad')

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:reporte')
  })
})
