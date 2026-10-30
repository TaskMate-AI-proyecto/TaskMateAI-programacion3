import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { emptyFilters } from './taskUtils'
import { TaskFilters } from './TaskFilters'

function renderFilters() {
  const onChange = vi.fn()

  render(<TaskFilters categories={[{ id: 'c1', name: 'Facultad', color: '#22c55e' }]} filters={emptyFilters} onChange={onChange} />)

  return { onChange, user: userEvent.setup() }
}

describe('TaskFilters', () => {
  it('informa el texto de búsqueda al escribir', async () => {
    const { onChange, user } = renderFilters()

    await user.type(screen.getByPlaceholderText('Buscar por título o descripción'), 'p')

    expect(onChange).toHaveBeenCalledWith({ search: 'p' })
  })

  it('filtra por estado, categoría y prioridad', async () => {
    const { onChange, user } = renderFilters()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'COMPLETED')
    expect(onChange).toHaveBeenLastCalledWith({ status: 'COMPLETED' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Categoría' }), 'c1')
    expect(onChange).toHaveBeenLastCalledWith({ categoryId: 'c1' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Prioridad' }), 'HIGH')
    expect(onChange).toHaveBeenLastCalledWith({ priority: 'HIGH' })
  })
})
