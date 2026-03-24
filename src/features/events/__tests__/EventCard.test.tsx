import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventCard, type EventCardData } from '../EventCard'

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

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

// Use T12:00:00Z to avoid UTC-midnight timezone edge cases
const BASE_EVENT: EventCardData = {
  slug: 'priestly-ordination-2026',
  title: 'Priestly Ordination 2026',
  excerpt: 'Three deacons will be ordained at the cathedral in Asmara.',
  eventType: 'ordination',
  startDate: '2026-06-15T12:00:00Z', // June 15 — safe for all ±12 timezones
  location: 'Segeneyti Cathedral',
}

describe('EventCard', () => {
  it('renders the event title', () => {
    render(<EventCard event={BASE_EVENT} />)
    expect(screen.getByText('Priestly Ordination 2026')).toBeInTheDocument()
  })

  it('links the title to the correct event detail URL', () => {
    render(<EventCard event={BASE_EVENT} />)
    expect(
      screen.getByRole('link', { name: 'Priestly Ordination 2026' }),
    ).toHaveAttribute('href', `/events/${BASE_EVENT.slug}`)
  })

  it('renders the event type badge (capitalised)', () => {
    render(<EventCard event={BASE_EVENT} />)
    expect(screen.getByText('Ordination')).toBeInTheDocument()
  })

  it('renders the excerpt', () => {
    render(<EventCard event={BASE_EVENT} />)
    expect(screen.getByText(BASE_EVENT.excerpt)).toBeInTheDocument()
  })

  it('renders the location when provided', () => {
    render(<EventCard event={BASE_EVENT} />)
    expect(screen.getByText('Segeneyti Cathedral')).toBeInTheDocument()
  })

  it('does not render location when it is omitted', () => {
    render(<EventCard event={{ ...BASE_EVENT, location: undefined }} />)
    expect(screen.queryByText('Segeneyti Cathedral')).toBeNull()
  })

  it('renders the day number from startDate in the date badge', () => {
    render(<EventCard event={BASE_EVENT} />)
    // June 15 at noon UTC = day 15 in UTC
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('applies opacity-70 for past events', () => {
    const { container } = render(
      <EventCard event={{ ...BASE_EVENT, isPast: true }} />,
    )
    expect(container.querySelector('article')).toHaveClass('opacity-70')
  })

  it('does not apply opacity-70 for current/upcoming events', () => {
    const { container } = render(<EventCard event={BASE_EVENT} />)
    expect(container.querySelector('article')).not.toHaveClass('opacity-70')
  })

  it('renders as an <article> element', () => {
    const { container } = render(<EventCard event={BASE_EVENT} />)
    expect(container.querySelector('article')).toBeInTheDocument()
  })
})
