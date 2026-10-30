import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateSubtasks } from '../../api/aiApi'
import { ToastProvider } from '../../context/ToastProvider'
import { SubtaskGenerator } from './SubtaskGenerator'

vi.mock('../../api/aiApi', () => ({
  generateSubtasks: vi.fn(),
  getDailySummary: vi.fn(),
}))

function renderGenerator() {
  const onAccept = vi.fn()

  render(
    <ToastProvider>
      <SubtaskGenerator onAccept={onAccept} taskId="t1" />
    </ToastProvider>,
  )

  return { onAccept, user: userEvent.setup() }
}

async function generateSuggestions(user: ReturnType<typeof userEvent.setup>) {
  vi.mocked(generateSubtasks).mockResolvedValue(['Leer', 'Resumir', 'Repasar'])

  await user.click(screen.getByRole('button', { name: 'Desglosar con IA' }))
  await screen.findByRole('checkbox', { name: 'Incluir subtarea 1' })
}

describe('SubtaskGenerator', () => {
  beforeEach(() => {
    vi.mocked(generateSubtasks).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('genera subtareas, permite ajustarlas y las agrega a la tarea', async () => {
    const { user, onAccept } = renderGenerator()
    await generateSuggestions(user)

    expect(generateSubtasks).toHaveBeenCalledWith('t1')
    expect(screen.getByRole('button', { name: 'Agregar 3 a la tarea' })).toBeEnabled()

    await user.click(screen.getByRole('checkbox', { name: 'Incluir subtarea 2' }))
    await user.click(screen.getByRole('button', { name: 'Agregar 2 a la tarea' }))

    expect(onAccept).toHaveBeenCalledWith(['Leer', 'Repasar'])
    expect(await screen.findByText(/Subtareas añadidas a la descripción/)).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('edita el texto de una sugerencia antes de agregarla', async () => {
    const { user, onAccept } = renderGenerator()
    await generateSuggestions(user)

    const field = screen.getByRole('textbox', { name: 'Subtarea 1' })
    await user.clear(field)
    await user.type(field, 'Leer el capítulo 2')
    await user.click(screen.getByRole('button', { name: 'Agregar 3 a la tarea' }))

    expect(onAccept).toHaveBeenCalledWith(expect.arrayContaining(['Leer el capítulo 2']))
  })

  it('descarta una sugerencia o todas', async () => {
    const { user } = renderGenerator()
    await generateSuggestions(user)

    await user.click(screen.getByRole('button', { name: 'Descartar subtarea 1' }))
    expect(screen.getByRole('textbox', { name: 'Subtarea 1' })).toHaveValue('Resumir')
    expect(screen.getByRole('textbox', { name: 'Subtarea 2' })).toHaveValue('Repasar')
    expect(screen.queryByRole('textbox', { name: 'Subtarea 3' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desglosar con IA' })).toBeInTheDocument()
  })

  it('ofrece regenerar cuando ya hay sugerencias', async () => {
    const { user } = renderGenerator()
    await generateSuggestions(user)

    expect(screen.getByRole('button', { name: 'Regenerar' })).toBeInTheDocument()
  })

  it('muestra el progreso mientras la IA responde', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(generateSubtasks).mockReturnValue(new Promise<string[]>(() => {}))
    const { user } = renderGenerator()

    await user.click(screen.getByRole('button', { name: 'Desglosar con IA' }))

    expect(screen.getByRole('button', { name: 'Generando...' })).toBeDisabled()
    expect(screen.getByText('Analizando la tarea...')).toBeInTheDocument()

    // El avance del reloj debe ocurrir dentro de act para que React pinte el nuevo paso.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500)
    })

    expect(screen.getByText('Pensando los pasos...')).toBeInTheDocument()
  })

  it('informa del error y no muestra sugerencias', async () => {
    vi.mocked(generateSubtasks).mockRejectedValue(new Error('caído'))
    const { user } = renderGenerator()

    await user.click(screen.getByRole('button', { name: 'Desglosar con IA' }))

    expect(await screen.findByText('La IA no pudo completar la solicitud. Inténtalo más tarde.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('checkbox')).not.toBeInTheDocument())
  })
})
