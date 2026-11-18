import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestProductivityReport } from '../../api/productivityReportApi'
import ProductivityReportExport from './ProductivityReportExport.vue'

vi.mock('../../api/productivityReportApi', () => ({ requestProductivityReport: vi.fn() }))

const requestMock = vi.mocked(requestProductivityReport)
const downloads: string[] = []

function findButton(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((item) => item.text() === text)
  if (!button) throw new Error(`No existe el botón ${text}`)

  return button
}

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
    const wrapper = mount(ProductivityReportExport, { attachTo: document.body })

    await findButton(wrapper, 'Exportar Reporte PDF').trigger('click')

    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Vista previa del reporte')
    expect(wrapper.find('[role="status"]').text()).toContain('Groq está analizando')
    finish(new Blob(['%PDF-1.4'], { type: 'application/pdf' }))
    await flushPromises()

    expect(wrapper.find('iframe').attributes('src')).toBe('blob:reporte')
    expect(downloads).toHaveLength(1)
    expect(downloads[0]).toMatch(/^Reporte_Productividad_TaskMate_\d{4}-\d{2}-\d{2}\.pdf$/)
    wrapper.unmount()
  })

  it('muestra el error con opción de reintentar', async () => {
    requestMock.mockRejectedValueOnce(new Error('caído')).mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
    const wrapper = mount(ProductivityReportExport, { attachTo: document.body })

    await findButton(wrapper, 'Exportar Reporte PDF').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('No se pudo generar el reporte')

    await findButton(wrapper, 'Reintentar').trigger('click')
    await flushPromises()

    expect(wrapper.find('iframe').exists()).toBe(true)
    expect(requestMock).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('al cerrar el modal libera la vista previa', async () => {
    requestMock.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }))
    const wrapper = mount(ProductivityReportExport, { attachTo: document.body })
    await findButton(wrapper, 'Exportar Reporte PDF').trigger('click')
    await flushPromises()

    await wrapper.find('button[aria-label="Cerrar"]').trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:reporte')
    wrapper.unmount()
  })
})
