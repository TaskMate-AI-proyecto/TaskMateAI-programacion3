import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GamificationContext } from '../context/gamificationContext'
import { ToastProvider } from '../context/ToastProvider'
import type { TaskWithReward } from '../types/api'
import { useRewardNotifier } from './useRewardNotifier'

const completed: TaskWithReward = {
  id: 'task-1',
  title: 'Estudiar',
  description: null,
  status: 'COMPLETED',
  priority: 'HIGH',
  dueDate: null,
  categoryId: null,
  category: null,
  reward: {
    xpGained: 50,
    xp: 50,
    level: 1,
    currentStreak: 1,
    longestStreak: 1,
    newAchievements: [{ key: 'FIRST_TASK', title: 'Primer paso' }],
  },
}

function Harness({ task }: { task: TaskWithReward }) {
  const announce = useRewardNotifier()

  return <button onClick={() => announce(task)} type="button">Anunciar</button>
}

describe('useRewardNotifier', () => {
  it('muestra el XP ganado, el logro nuevo y actualiza el perfil', async () => {
    const applyCompletion = vi.fn()
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <GamificationContext value={{ profile: null, applyCompletion }}>
          <Harness task={completed} />
        </GamificationContext>
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Anunciar' }))

    expect(await screen.findByText('+50 XP')).toBeInTheDocument()
    expect(screen.getByText('¡Nuevo logro desbloqueado! Primer paso')).toBeInTheDocument()
    expect(applyCompletion).toHaveBeenCalledWith(completed.reward)
  })

  it('no hace nada si la tarea no trae recompensa', async () => {
    const applyCompletion = vi.fn()
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <GamificationContext value={{ profile: null, applyCompletion }}>
          <Harness task={{ ...completed, reward: null }} />
        </GamificationContext>
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Anunciar' }))

    expect(screen.queryByText(/XP/)).not.toBeInTheDocument()
    expect(applyCompletion).not.toHaveBeenCalled()
  })
})
