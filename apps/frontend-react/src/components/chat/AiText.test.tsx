import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AiText } from './AiText'

describe('AiText', () => {
  it('muestra la negrita sin asteriscos y separa las listas en ítems', () => {
    const { container } = render(<AiText text={'Hola **mundo**.\n\n1. Leer\n2. Resumir'} />)

    expect(screen.getByText('mundo').tagName).toBe('STRONG')
    expect(container.textContent).not.toContain('**')
    expect(container.querySelector('ol')?.querySelectorAll('li')).toHaveLength(2)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('usa una lista con viñetas para los guiones', () => {
    const { container } = render(<AiText text={'- Uno\n- Dos'} />)

    expect(container.querySelector('ul')?.querySelectorAll('li')).toHaveLength(2)
  })
})
