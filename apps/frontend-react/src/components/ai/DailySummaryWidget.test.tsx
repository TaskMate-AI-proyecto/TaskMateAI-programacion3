import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDailySummary } from '../../api/aiApi'
import { ToastProvider } from '../../context/ToastProvider'
import { DailySummaryWidget } from './DailySummaryWidget'

vi.mock('../../api/aiApi', () => ({ getDailySummary: vi.fn() }))

// Error HTTP 429 con la forma que reconoce isAxiosError.
function quotaError() {
  return Object.assign(new Error('quota exceeded'), { isAxiosError: true, response: { status: 429, data: {} } })
}

function renderWidget() {
  render(
    <ToastProvider>
      <DailySummaryWidget />
    </ToastProvider>,
  )

  return userEvent.setup()
}

describe('DailySummaryWidget', () => {
  beforeEach(() => {
    vi.mocked(getDailySummary).mockReset()
  })

  it('muestra el límite de la IA en un banner de advertencia con botón para reintentar', async () => {
    vi.mocked(getDailySummary).mockRejectedValueOnce(quotaError())
    renderWidget()

    const banner = await screen.findByRole('alert')
    expect(banner).toHaveTextContent('Se alcanzó el límite de uso de la IA')
    expect(banner).toHaveClass('bg-amber-500/10', 'border-amber-500/20')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('reintenta la llamada al asistente y muestra el resumen cuando vuelve a responder', async () => {
    vi.mocked(getDailySummary).mockRejectedValueOnce(quotaError()).mockResolvedValueOnce('Hoy: estudiar.')
    const user = renderWidget()

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Hoy: estudiar.')).toBeInTheDocument()
    expect(getDailySummary).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })
})
