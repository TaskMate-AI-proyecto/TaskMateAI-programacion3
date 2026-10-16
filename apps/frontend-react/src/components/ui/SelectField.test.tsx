import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectField } from './SelectField'
import { toOptions, withEmptyOption } from './selectOptions'

type Priority = 'LOW' | 'HIGH'

const options = toOptions<Priority>({ LOW: 'Baja', HIGH: 'Alta' })

describe('SelectField', () => {
  it('renderiza las opciones y la seleccionada', () => {
    render(<SelectField label="Prioridad" onChange={vi.fn()} options={options} value="HIGH" />)

    const select = screen.getByRole('combobox', { name: 'Prioridad' })

    expect(select).toHaveValue('HIGH')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Baja', 'Alta'])
  })

  it('devuelve el valor elegido al cambiar la selección', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SelectField label="Prioridad" onChange={onChange} options={options} value="HIGH" />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Prioridad' }), 'Baja')

    expect(onChange).toHaveBeenCalledWith('LOW')
  })

  it('mantiene la etiqueta accesible aunque se oculte visualmente', () => {
    render(<SelectField hideLabel label="Categoría" onChange={vi.fn()} options={withEmptyOption('Todas', options)} value="" />)

    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('')
    expect(screen.getByText('Categoría')).toHaveClass('sr-only')
    expect(screen.getByRole('option', { name: 'Todas' })).toBeInTheDocument()
  })
})
