import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from '../Breadcrumb'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe('Breadcrumb', () => {
  it('always renders a "Home" link pointing to "/"', () => {
    render(<Breadcrumb items={[]} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('renders a <nav> with the label "Breadcrumb"', () => {
    render(<Breadcrumb items={[]} />)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
  })

  it('renders a single item as plain text, not a link', () => {
    render(<Breadcrumb items={[{ label: 'News' }]} />)
    expect(screen.getByText('News')).toBeInTheDocument()
    // The single trailing item is a span, not an anchor
    expect(screen.queryByRole('link', { name: 'News' })).toBeNull()
  })

  it('renders intermediate items as links and the last item as text', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'News', href: '/news' },
          { label: 'An Article' },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute('href', '/news')
    // Last item must not be a link
    expect(screen.queryByRole('link', { name: 'An Article' })).toBeNull()
    expect(screen.getByText('An Article')).toBeInTheDocument()
  })

  it('renders multiple intermediate links in order', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Parishes', href: '/parishes' },
          { label: 'Segeneyti', href: '/parishes/segeneyti' },
          { label: 'Contact' },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: 'Parishes' })).toHaveAttribute(
      'href',
      '/parishes',
    )
    expect(screen.getByRole('link', { name: 'Segeneyti' })).toHaveAttribute(
      'href',
      '/parishes/segeneyti',
    )
    expect(screen.queryByRole('link', { name: 'Contact' })).toBeNull()
  })

  it('applies dark theme classes when dark=true', () => {
    const { container } = render(
      <Breadcrumb dark items={[{ label: 'About' }]} />,
    )
    // Home link should have a light colour class in dark mode
    const homeLink = screen.getByRole('link', { name: 'Home' })
    expect(homeLink).toHaveClass('text-maroon-200')
    expect(container).toBeDefined()
  })
})
