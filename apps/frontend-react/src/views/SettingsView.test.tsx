import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteTask, getTasks } from '../api/tasksApi'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastProvider'
import { chatStorageKey, settingsStorageKey } from '../settings/settings'
import type { Task } from '../types/api'
import { SettingsView } from './SettingsView'

vi.mock('../api/tasksApi', () => ({ getTasks: vi.fn(), deleteTask: vi.fn() }))

function task(id: string): Task {
  return { id, title: id, description: null, status: 'PENDING', priority: 'LOW', dueDate: null, categoryId: null, category: null }
}

function renderSettings() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <SettingsView />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )

  return userEvent.setup()
}

describe('SettingsView', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('style')
    document.documentElement.classList.remove('dark')
    vi.mocked(getTasks).mockReset()
    vi.mocked(deleteTask).mockReset()
  })

  it('muestra los campos con etiqueta asociada y el acabado de vidrio compartido', async () => {
    const user = renderSettings()

    expect(screen.getByLabelText('Nombre de usuario')).toHaveClass('settings-field')
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('readonly')
    await user.click(screen.getByRole('tab', { name: 'Asistente IA' }))
    expect(screen.getByLabelText('Instrucciones personalizadas')).toHaveClass('settings-textarea')
    expect(screen.getByText('0/500 · Se añaden al prompt del sistema de cada conversación.')).toHaveClass('settings-hint')
  })

  it('guarda el nombre de usuario en localStorage y lo muestra en el avatar', async () => {
    const user = renderSettings()

    await user.type(screen.getByPlaceholderText('Cómo quieres que te llamemos'), 'Ana')

    expect(JSON.parse(localStorage.getItem(settingsStorageKey) ?? '{}')).toMatchObject({ displayName: 'Ana' })
    expect(screen.getByText('A', { selector: 'span[aria-hidden]' })).toBeInTheDocument()
  })

  it('cambia la personalidad y guarda las instrucciones del asistente', async () => {
    const user = renderSettings()

    await user.click(screen.getByRole('tab', { name: 'Asistente IA' }))
    await user.click(screen.getByRole('radio', { name: /Conciso/ }))
    await user.type(screen.getByLabelText('Instrucciones personalizadas'), 'Responde en tercera persona')

    expect(JSON.parse(localStorage.getItem(settingsStorageKey) ?? '{}')).toMatchObject({
      personality: 'concise',
      customInstructions: 'Responde en tercera persona',
    })
  })

  it('limpia el historial del chat sólo después de confirmar', async () => {
    localStorage.setItem(chatStorageKey, '[{"id":"1"}]')
    const user = renderSettings()

    await user.click(screen.getByRole('tab', { name: 'Asistente IA' }))
    await user.click(screen.getByRole('button', { name: 'Limpiar historial' }))
    expect(localStorage.getItem(chatStorageKey)).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Limpiar' }))

    expect(localStorage.getItem(chatStorageKey)).toBeNull()
    expect(screen.getByText('Historial del chat borrado')).toBeInTheDocument()
  })

  it('aplica el acento elegido a las variables globales', async () => {
    const user = renderSettings()

    await user.click(screen.getByRole('tab', { name: 'Apariencia' }))
    await user.click(screen.getByRole('button', { name: 'Cian' }))

    expect(document.documentElement.style.getPropertyValue('--indigo-500')).toBe('6 182 212')
    expect(JSON.parse(localStorage.getItem(settingsStorageKey) ?? '{}')).toMatchObject({ accent: 'cyan' })
  })

  it('cambia el tema desde la pestaña Apariencia', async () => {
    const user = renderSettings()

    await user.click(screen.getByRole('tab', { name: 'Apariencia' }))
    await user.click(screen.getByRole('button', { name: 'Oscuro' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('taskmate.theme')).toBe('dark')
  })

  it('exporta las tareas en JSON', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:taskmate')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.mocked(getTasks).mockResolvedValue([task('a')])
    const user = renderSettings()

    await user.click(screen.getByRole('tab', { name: 'Seguridad & Datos' }))
    await user.click(screen.getByRole('button', { name: 'JSON' }))

    expect(click).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Tareas exportadas en JSON')).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('restablece las tareas tras confirmar en la zona de peligro', async () => {
    vi.mocked(getTasks).mockResolvedValue([task('a'), task('b')])
    vi.mocked(deleteTask).mockResolvedValue(undefined)
    const user = renderSettings()

    await user.click(screen.getByRole('tab', { name: 'Seguridad & Datos' }))
    await user.click(screen.getByRole('button', { name: 'Restablecer tareas' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Se eliminarán 2 tareas. Esta acción no se puede deshacer.')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar todo' }))

    expect(deleteTask).toHaveBeenCalledWith('a')
    expect(deleteTask).toHaveBeenCalledWith('b')
  })
})
