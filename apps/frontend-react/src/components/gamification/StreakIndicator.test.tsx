import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { GamificationContext } from '../../context/gamificationContext'
import type { GamificationProfile } from '../../types/api'
import { StreakIndicator } from './StreakIndicator'

const profile: GamificationProfile = {
  xp: 120,
  level: 3,
  levelStartXp: 100,
  nextLevelXp: 400,
  currentStreak: 4,
  longestStreak: 4,
  achievements: [],
}

describe('StreakIndicator', () => {
  it('muestra la racha y el nivel y lleva a la vista de logros', () => {
    render(
      <GamificationContext value={{ profile, applyCompletion: vi.fn() }}>
        <MemoryRouter>
          <StreakIndicator />
        </MemoryRouter>
      </GamificationContext>,
    )

    const link = screen.getByRole('link', { name: 'Logros: racha de 4 días, nivel 3' })
    expect(link).toHaveAttribute('href', '/achievements')
    expect(link).toHaveTextContent('Nvl 3')
  })

  it('no muestra nada sin proveedor de gamificación', () => {
    render(
      <MemoryRouter>
        <StreakIndicator />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
