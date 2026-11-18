import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGamificationProfile } from '../api/gamificationApi'
import type { GamificationProfile } from '../types/api'
import AchievementsView from './AchievementsView.vue'

vi.mock('../api/gamificationApi', () => ({ getGamificationProfile: vi.fn() }))

const profile: GamificationProfile = {
  xp: 150,
  level: 2,
  levelStartXp: 100,
  nextLevelXp: 400,
  currentStreak: 3,
  longestStreak: 7,
  achievements: [
    { key: 'FIRST_TASK', title: 'Primer paso', description: 'Completa tu primera tarea.', unlocked: true, unlockedAt: '2026-11-10T10:00:00.000Z' },
    { key: 'STREAK_3', title: 'En racha', description: 'Completa tareas 3 días seguidos.', unlocked: false, unlockedAt: null },
  ],
}

async function renderView() {
  setActivePinia(createPinia())
  const wrapper = mount(AchievementsView)
  await flushPromises()

  return wrapper
}

describe('AchievementsView', () => {
  beforeEach(() => {
    vi.mocked(getGamificationProfile).mockResolvedValue(profile)
  })

  it('muestra el nivel, las rachas y el progreso hacia el siguiente nivel', async () => {
    const wrapper = await renderView()

    expect(wrapper.find('h2').text()).toBe('Nivel 2')
    expect(wrapper.text()).toContain('Racha actual')
    expect(wrapper.text()).toContain('Racha máxima')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('17')
  })

  it('distingue los logros desbloqueados de los bloqueados con su requisito', async () => {
    const wrapper = await renderView()
    const items = wrapper.findAll('li')

    expect(items[0].text()).toContain('Primer paso')
    expect(items[0].text()).toContain('Obtenido el')
    expect(items[0].classes()).not.toContain('opacity-50')
    expect(items[1].classes()).toContain('opacity-50')
    expect(items[1].text()).toContain('Requisito: Completa tareas 3 días seguidos.')
  })

  it('muestra un error con reintento y vuelve a pedir el perfil', async () => {
    vi.mocked(getGamificationProfile).mockRejectedValueOnce(new Error('caído'))
    const wrapper = await renderView()

    expect(wrapper.text()).toContain('No se pudieron cargar tus logros.')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('h2').text()).toBe('Nivel 2')
    expect(getGamificationProfile).toHaveBeenCalledTimes(2)
  })
})
