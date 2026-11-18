import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFriends } from '../api/friendsApi'
import { getTasks, toggleTaskStatus } from '../api/tasksApi'
import { TaskSyncProvider } from '../context/TaskSyncProvider'
import { ToastProvider } from '../context/ToastProvider'
import type { Friend, Task } from '../types/api'
import { CommandPaletteProvider } from './CommandPaletteProvider'

vi.mock('../api/tasksApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/tasksApi')>()),
  getTasks: vi.fn(),
  toggleTaskStatus: vi.fn(),
}))

vi.mock('../api/friendsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/friendsApi')>()),
  getFriends: vi.fn(),
}))

const pendingTask: Task = {
  id: 't1',
  title: 'Comprar pan',
  description: null,
  status: 'PENDING',
  priority: 'MEDIUM',
  dueDate: null,
  categoryId: null,
  category: null,
}

const friend: Friend = {
  friendshipId: 'f1',
  friend: { id: 'u2', email: 'bea@example.com', uniqueTag: 'bea#1' },
  since: '2026-01-01T00:00:00.000Z',
}

function LocationProbe() {
  const location = useLocation()

  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>
}

function renderPalette(path = '/dashboard') {
  render(
    <ToastProvider>
      <TaskSyncProvider>
        <MemoryRouter initialEntries={[path]}>
          <CommandPaletteProvider>
            <Routes>
              <Route element={<LocationProbe />} path="*" />
            </Routes>
          </CommandPaletteProvider>
        </MemoryRouter>
      </TaskSyncProvider>
    </ToastProvider>,
  )

  return userEvent.setup()
}

function currentLocation() {
  return screen.getByTestId('location').textContent
}

async function openWithShortcut(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard('{Control>}k{/Control}')
  return screen.findByRole('dialog', { name: 'Paleta de comandos' })
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.mocked(getTasks).mockResolvedValue([])
    vi.mocked(getFriends).mockResolvedValue([])
    vi.mocked(toggleTaskStatus).mockResolvedValue({ ...pendingTask, status: 'COMPLETED' })
  })

  it('se abre con Ctrl+K y con Cmd+K, y se cierra con Escape', async () => {
    const user = renderPalette()

    await openWithShortcut(user)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Paleta de comandos' })).not.toBeInTheDocument()

    await user.keyboard('{Meta>}k{/Meta}')
    expect(await screen.findByRole('dialog', { name: 'Paleta de comandos' })).toBeInTheDocument()
  })

  it('se cierra al hacer clic fuera del panel', async () => {
    const user = renderPalette()
    const dialog = await openWithShortcut(user)

    await user.click(dialog.parentElement as HTMLElement)

    expect(screen.queryByRole('dialog', { name: 'Paleta de comandos' })).not.toBeInTheDocument()
  })

  it('agrupa los comandos por Acciones, Vistas y Amigos con sus atajos a la derecha', async () => {
    const user = renderPalette()
    await openWithShortcut(user)

    const groups = screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))
    expect(groups).toEqual(['Acciones', 'Vistas'])
    const kanban = screen.getByRole('option', { name: /Kanban/ })
    expect(within(kanban).getByText('G')).toBeInTheDocument()
    expect(within(kanban).getByText('K')).toBeInTheDocument()
  })

  it('navega con las flechas y ejecuta con Enter', async () => {
    const user = renderPalette()
    await openWithShortcut(user)

    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')

    await user.type(screen.getByRole('combobox'), 'ajustes')
    await user.keyboard('{Enter}')

    expect(currentLocation()).toBe('/settings')
    expect(screen.queryByRole('dialog', { name: 'Paleta de comandos' })).not.toBeInTheDocument()
  })

  it('indica cuando no hay resultados', async () => {
    const user = renderPalette()
    await openWithShortcut(user)

    await user.type(screen.getByRole('combobox'), 'zzzzqq')

    expect(screen.getByText('Sin resultados para «zzzzqq»')).toBeInTheDocument()
  })

  it('abre Kanban como vista del Dashboard', async () => {
    const user = renderPalette('/tasks')
    await openWithShortcut(user)

    await user.type(screen.getByRole('combobox'), 'kanban')
    await user.keyboard('{Enter}')

    expect(currentLocation()).toBe('/dashboard')
    expect(window.localStorage.getItem('taskmate_view_mode')).toBe('kanban')
  })

  it('responde a los atajos g + letra y n fuera de campos de texto', async () => {
    const user = renderPalette()

    await user.keyboard('gm')
    expect(currentLocation()).toBe('/messages')

    await user.keyboard('n')
    expect(currentLocation()).toBe('/tasks?nueva=1')
  })

  it('abre una tarea existente y pasa su id en la URL', async () => {
    vi.mocked(getTasks).mockResolvedValue([pendingTask])
    const user = renderPalette()
    await openWithShortcut(user)

    await user.type(screen.getByRole('combobox'), 'comprar')
    await user.click(await screen.findByRole('option', { name: /Abrir: Comprar pan/ }))

    expect(currentLocation()).toBe('/tasks?tarea=t1')
  })

  it('completa una tarea desde la paleta', async () => {
    vi.mocked(getTasks).mockResolvedValue([pendingTask])
    const user = renderPalette()
    await openWithShortcut(user)

    await user.type(screen.getByRole('combobox'), 'completar comprar')
    await user.click(await screen.findByRole('option', { name: 'Completar: Comprar pan' }))

    expect(toggleTaskStatus).toHaveBeenCalledWith(pendingTask)
  })

  it('inicia una conversación directa con un amigo por su identificador', async () => {
    vi.mocked(getFriends).mockResolvedValue([friend])
    const user = renderPalette()
    await openWithShortcut(user)

    await user.type(screen.getByRole('combobox'), 'bea')
    const option = await screen.findByRole('option', { name: /Mensaje a bea#1/ })
    expect(within(option).getByText('Iniciar DM')).toBeInTheDocument()

    await user.click(option)

    expect(currentLocation()).toBe('/messages?contacto=u2')
  })
})
