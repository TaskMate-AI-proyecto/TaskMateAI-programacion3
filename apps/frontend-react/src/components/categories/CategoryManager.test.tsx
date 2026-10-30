import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCategory, deleteCategory, updateCategory } from '../../api/categoriesApi'
import { ToastProvider } from '../../context/ToastProvider'
import type { Category } from '../../types/api'
import { CategoryManager } from './CategoryManager'

vi.mock('../../api/categoriesApi', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

const facultad: Category = { id: 'c1', name: 'Facultad', color: '#22C55E' }

function renderManager(categories: Category[] = [facultad]) {
  const onChanged = vi.fn()
  const onClose = vi.fn()

  render(
    <ToastProvider>
      <CategoryManager categories={categories} onChanged={onChanged} onClose={onClose} />
    </ToastProvider>,
  )

  return { onChanged, onClose, user: userEvent.setup() }
}

describe('CategoryManager', () => {
  beforeEach(() => {
    vi.mocked(createCategory).mockResolvedValue(facultad)
    vi.mocked(updateCategory).mockResolvedValue(facultad)
    vi.mocked(deleteCategory).mockResolvedValue(undefined)
  })

  it('muestra un estado vacío cuando no hay categorías', () => {
    renderManager([])

    expect(screen.getByText('Todavía no hay categorías. Crea una abajo.')).toBeInTheDocument()
  })

  it('crea una categoría con el color elegido y avisa del cambio', async () => {
    const { user, onChanged } = renderManager([])

    await user.type(screen.getByLabelText('Nombre'), 'Trabajo')
    await user.click(screen.getByRole('button', { name: 'Color #3B82F6' }))
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

    expect(createCategory).toHaveBeenCalledWith({ name: 'Trabajo', color: '#3b82f6' })
    expect(await screen.findByText('Categoría creada')).toBeInTheDocument()
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  it('no permite guardar una categoría sin nombre', async () => {
    const { user } = renderManager([])

    expect(screen.getByRole('button', { name: 'Crear categoría' })).toBeDisabled()

    await user.type(screen.getByLabelText('Nombre'), '   ')

    expect(screen.getByRole('button', { name: 'Crear categoría' })).toBeDisabled()
  })

  it('carga la categoría en el formulario para editarla', async () => {
    const { user } = renderManager()

    await user.click(screen.getByRole('button', { name: 'Editar Facultad' }))

    expect(screen.getByRole('heading', { name: 'Editar categoría' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Facultad')

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Universidad')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(updateCategory).toHaveBeenCalledWith('c1', { name: 'Universidad', color: '#22c55e' })
    expect(await screen.findByText('Categoría actualizada')).toBeInTheDocument()
  })

  it('cancela la edición y vuelve al formulario de creación', async () => {
    const { user } = renderManager()

    await user.click(screen.getByRole('button', { name: 'Editar Facultad' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar edición' }))

    expect(screen.getByRole('heading', { name: 'Nueva categoría' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('')
  })

  it('pide confirmación antes de eliminar y elimina tras confirmar', async () => {
    const { user, onChanged } = renderManager()

    await user.click(screen.getByRole('button', { name: 'Eliminar Facultad' }))
    expect(screen.getByText('¿Eliminar?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'No' }))
    expect(deleteCategory).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eliminar Facultad' }))
    await user.click(screen.getByRole('button', { name: 'Sí' }))

    expect(deleteCategory).toHaveBeenCalledWith('c1')
    expect(await screen.findByText('Categoría eliminada')).toBeInTheDocument()
    expect(onChanged).toHaveBeenCalled()
  })

  it('explica por qué falló el borrado', async () => {
    vi.mocked(deleteCategory).mockRejectedValue(new Error('tiene tareas'))
    const { user, onChanged } = renderManager()

    await user.click(screen.getByRole('button', { name: 'Eliminar Facultad' }))
    await user.click(screen.getByRole('button', { name: 'Sí' }))

    expect(
      await screen.findByText('No se pudo eliminar. Si tiene tareas asociadas, reasígnalas primero.'),
    ).toBeInTheDocument()
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('muestra el error y conserva el nombre si falla el guardado', async () => {
    vi.mocked(createCategory).mockRejectedValue(new Error('network'))
    const { user, onChanged } = renderManager([])

    await user.type(screen.getByLabelText('Nombre'), 'Sin conexión')
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

    expect(await screen.findByText('No se pudo completar la solicitud.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Sin conexión')
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('lista las categorías existentes con sus acciones', () => {
    renderManager([facultad, { id: 'c2', name: 'Casa', color: '#ef6f5e' }])

    const list = screen.getByRole('button', { name: 'Editar Facultad' }).closest('ul')!
    expect(within(list).getByText('Casa')).toBeInTheDocument()
  })
})
