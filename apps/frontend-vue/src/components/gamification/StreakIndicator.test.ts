import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGamificationStore } from '../../stores/gamification'
import StreakIndicator from './StreakIndicator.vue'

describe('StreakIndicator', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('muestra la racha y el nivel y lleva a la vista de logros', () => {
    const gamification = useGamificationStore()
    gamification.profile = {
      xp: 120,
      level: 3,
      levelStartXp: 100,
      nextLevelXp: 400,
      currentStreak: 4,
      longestStreak: 4,
      achievements: [],
    }

    const wrapper = mount(StreakIndicator, { global: { stubs: { RouterLink: RouterLinkStub } } })

    expect(wrapper.text()).toContain('4')
    expect(wrapper.text()).toContain('Nvl 3')
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/achievements')
  })

  it('no muestra nada mientras no hay perfil', () => {
    const wrapper = mount(StreakIndicator, { global: { stubs: { RouterLink: RouterLinkStub } } })

    expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false)
  })
})
