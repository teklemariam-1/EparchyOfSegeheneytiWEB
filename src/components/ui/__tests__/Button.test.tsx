import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('renders as a <button> element', () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole('button').tagName).toBe('BUTTON')
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies btn-primary class by default', () => {
    render(<Button>Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })

  it('applies btn-secondary class for secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-secondary')
  })

  it('applies btn-ghost class for ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-ghost')
  })

  it('applies btn-gold class for gold variant', () => {
    render(<Button variant="gold">Gold</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-gold')
  })

  it('applies larger padding for lg size', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-7', 'py-3', 'text-base')
  })

  it('applies smaller padding for sm size', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-xs')
  })

  it('merges a custom className', () => {
    render(<Button className="mt-4 w-full">Styled</Button>)
    expect(screen.getByRole('button')).toHaveClass('mt-4', 'w-full')
  })

  it('forwards other HTML button attributes (type)', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
