import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CollaborativeBadge } from './CollaborativeBadge'

describe('CollaborativeBadge', () => {
  it('no muestra nada si la tarea no tiene colaboradores', () => {
    const { container } = render(<CollaborativeBadge users={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('muestra "Colaborativa" con el avatar de cada amigo', () => {
    render(<CollaborativeBadge users={[{ id: 'user-2', email: 'bob@example.com', uniqueTag: '@bob_123abc' }]} />)

    expect(screen.getByText('Colaborativa')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
