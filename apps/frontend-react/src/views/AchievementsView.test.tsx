import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGamificationProfile } from '../api/gamificationApi'
import type { GamificationProfile } from '../types/api'
import { AchievementsView } from './AchievementsView'

vi.mock('../api/gamificationApi', () => ({ getGamificationProfile: vi.fn() }))

const profile: GamificationProfile = {
  xp: 150,
  level: 2,
  levelStartXp: 100,
  nextLevelXp: 400,
  currentStreak: 3,
  longestStreak: 7,
  achievements: [
    {
      key: 'FIRST_TASK',
      title: 'Primer paso',
      description: 'Completa tu primera tarea.',
      unlocked: true,
      unlockedAt: '2026-11-10T10:00:00.000Z',
    },
    {
      key: 'STREAK_3',
      title: 'En racha',
      description: 'Completa tareas 3 días seguidos.',
      unlocked: false,
      unlockedAt: null,
    },
  ],
}

describe('AchievementsView', () => {
  beforeEach(() => {
    vi.mocked(getGamificationProfile).mockResolvedValue(profile)
  })

  it('muestra el nivel, las rachas y el progreso hacia el siguiente nivel', async () => {
    render(<AchievementsView />)

    expect(await screen.findByRole('heading', { name: 'Nivel 2' })).toBeInTheDocument()
    expect(screen.getByText('Racha actual').parentElement).toHaveTextContent('3 días')
    expect(screen.getByText('Racha máxima').parentElement).toHaveTextContent('7 días')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '17')
  })

  it('distingue los logros desbloqueados con fecha de los bloqueados con su requisito', async () => {
    render(<AchievementsView />)

    const unlocked = (await screen.findByText('Primer paso')).closest('li') as HTMLElement
    expect(unlocked).not.toHaveClass('opacity-50')
    expect(within(unlocked).getByText(/Obtenido el/)).toBeInTheDocument()

    const locked = screen.getByText('En racha').closest('li') as HTMLElement
    expect(locked).toHaveClass('opacity-50')
    expect(within(locked).getByText('Requisito: Completa tareas 3 días seguidos.')).toBeInTheDocument()
  })

  it('muestra un error con botón para reintentar y vuelve a pedir el perfil', async () => {
    vi.mocked(getGamificationProfile).mockRejectedValueOnce(new Error('caído'))
    const user = userEvent.setup()
    render(<AchievementsView />)

    expect(await screen.findByText('No se pudieron cargar tus logros.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Nivel 2' })).toBeInTheDocument()
    expect(getGamificationProfile).toHaveBeenCalledTimes(2)
  })
})
