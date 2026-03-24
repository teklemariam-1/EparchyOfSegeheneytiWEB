import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No results found" />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Try a different filter" />)
    expect(screen.getByText('Try a different filter')).toBeInTheDocument()
  })

  it('does not render description when omitted', () => {
    const { queryByText } = render(<EmptyState title="Empty" />)
    expect(queryByText('Try a different filter')).toBeNull()
  })

  it('renders an icon when provided', () => {
    render(
      <EmptyState title="Empty" icon={<span data-testid="custom-icon" />} />,
    )
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('does not render the icon wrapper when icon is omitted', () => {
    const { container } = render(<EmptyState title="Empty" />)
    // No icon wrapper div should appear
    expect(container.querySelector('[data-testid="custom-icon"]')).toBeNull()
  })

  it('renders an action element when provided', () => {
    render(
      <EmptyState title="Empty" action={<button>Reset filters</button>} />,
    )
    expect(screen.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument()
  })

  it('renders the title as an h3', () => {
    render(<EmptyState title="Nothing here" />)
    expect(screen.getByRole('heading', { level: 3, name: 'Nothing here' })).toBeInTheDocument()
  })
})
