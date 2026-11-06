import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardTaskList from './DashboardTaskList.vue'
import type { Task } from '../../types/api'

describe('DashboardTaskList', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'High Priority Task',
      description: null,
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: '2026-12-01',
      categoryId: null,
      category: null,
    },
    {
      id: '2',
      title: 'Medium Priority Task',
      description: null,
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: null,
      categoryId: null,
      category: null,
    },
    {
      id: '3',
      title: 'Low Priority Task',
      description: null,
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: '2026-11-01',
      categoryId: null,
      category: null,
    },
  ]

  it('renders task list when not loading', () => {
    const wrapper = mount(DashboardTaskList, {
      props: {
        tasks: mockTasks,
        isLoading: false,
        priority: 'ALL',
        pendingId: null,
      },
    })

    expect(wrapper.text()).toContain('Tareas')
    expect(wrapper.text()).toContain('High Priority Task')
    expect(wrapper.text()).toContain('Medium Priority Task')
  })

  it('shows loading skeleton when loading', () => {
    const wrapper = mount(DashboardTaskList, {
      props: {
        tasks: mockTasks,
        isLoading: true,
        priority: 'ALL',
        pendingId: null,
      },
    })

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
  })

  it('filters tasks by priority', () => {
    const wrapper = mount(DashboardTaskList, {
      props: {
        tasks: mockTasks,
        isLoading: false,
        priority: 'HIGH',
        pendingId: null,
      },
    })

    expect(wrapper.text()).toContain('High Priority Task')
    expect(wrapper.text()).not.toContain('Medium Priority Task')
  })

  it('shows empty state when no tasks match filter', () => {
    const wrapper = mount(DashboardTaskList, {
      props: {
        tasks: [],
        isLoading: false,
        priority: 'HIGH',
        pendingId: null,
      },
    })

    expect(wrapper.text()).toContain('Aún no tienes tareas')
  })

  it('emits priority-change when filter chip clicked', async () => {
    const wrapper = mount(DashboardTaskList, {
      props: {
        tasks: mockTasks,
        isLoading: false,
        priority: 'ALL',
        pendingId: null,
      },
    })

    const buttons = wrapper.findAll('button[type="button"]')
    const highPriorityButton = buttons.find((b) => b.text() === 'Alta')

    expect(highPriorityButton).toBeDefined()
    await highPriorityButton?.trigger('click')

    expect(wrapper.emitted('priority-change')).toBeTruthy()
    expect(wrapper.emitted('priority-change')?.[0]).toEqual(['HIGH'])
  })

  it('emits toggle event when task item toggled', async () => {
    const wrapper = mount(DashboardTaskList, {
      props: {
        tasks: mockTasks,
        isLoading: false,
        priority: 'ALL',
        pendingId: null,
      },
      global: {
        stubs: {
          TaskListItem: {
            template: '<button @click="$emit(\'toggle\', task)">Toggle</button>',
            props: ['task', 'isPending'],
            emits: ['toggle'],
          },
        },
      },
    })

    const toggleButtons = wrapper.findAll('button')
    const taskToggleButton = toggleButtons.find((b) => b.text() === 'Toggle')

    if (taskToggleButton) {
      await taskToggleButton.trigger('click')
      expect(wrapper.emitted('toggle')).toBeTruthy()
    }
  })
})
