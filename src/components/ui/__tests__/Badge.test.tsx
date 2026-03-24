import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Announcement</Badge>)
    expect(screen.getByText('Announcement')).toBeInTheDocument()
  })

  it('renders as a <span> element', () => {
    render(<Badge>Tag</Badge>)
    expect(screen.getByText('Tag').tagName).toBe('SPAN')
  })

  it('applies neutral variant classes by default', () => {
    render(<Badge>Test</Badge>)
    expect(screen.getByText('Test')).toHaveClass('bg-charcoal-100', 'text-charcoal-700')
  })

  it('applies maroon variant classes', () => {
    render(<Badge variant="maroon">Maroon</Badge>)
    expect(screen.getByText('Maroon')).toHaveClass('bg-maroon-100', 'text-maroon-800')
  })

  it('applies gold variant classes', () => {
    render(<Badge variant="gold">Gold</Badge>)
    expect(screen.getByText('Gold')).toHaveClass('bg-gold-100', 'text-gold-800')
  })

  it('applies green variant classes', () => {
    render(<Badge variant="green">Green</Badge>)
    expect(screen.getByText('Green')).toHaveClass('bg-green-100')
  })

  it('applies red variant classes', () => {
    render(<Badge variant="red">Red</Badge>)
    expect(screen.getByText('Red')).toHaveClass('bg-red-100')
  })

  it('applies sm size classes', () => {
    render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small')).toHaveClass('px-2', 'py-0.5')
  })

  it('merges a custom className', () => {
    render(<Badge className="uppercase tracking-wide">Custom</Badge>)
    expect(screen.getByText('Custom')).toHaveClass('uppercase', 'tracking-wide')
  })
})
