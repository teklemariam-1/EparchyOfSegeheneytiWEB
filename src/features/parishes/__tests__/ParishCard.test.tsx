import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParishCard, type ParishCardData } from '../ParishCard'

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

const BASE_PARISH: ParishCardData = {
  slug: 'st-mariam-segeneyti',
  name: 'St. Mariam Parish',
  vicariate: 'segeneyti',
  patronSaint: 'Our Lady',
  city: 'Segeneyti',
  priestName: 'Tesfamariam Haile',
}

describe('ParishCard', () => {
  it('renders the parish name', () => {
    render(<ParishCard parish={BASE_PARISH} />)
    expect(screen.getByText('St. Mariam Parish')).toBeInTheDocument()
  })

  it('links the name to the correct parish detail URL', () => {
    render(<ParishCard parish={BASE_PARISH} />)
    expect(
      screen.getByRole('link', { name: 'St. Mariam Parish' }),
    ).toHaveAttribute('href', `/parishes/${BASE_PARISH.slug}`)
  })

  it('renders the vicariate badge with proper capitalisation', () => {
    render(<ParishCard parish={BASE_PARISH} />)
    expect(screen.getByText('Segeneyti Vicariate')).toBeInTheDocument()
  })

  it('renders a hyphenated vicariate name correctly', () => {
    render(<ParishCard parish={{ ...BASE_PARISH, vicariate: 'adi-keyih' }} />)
    expect(screen.getByText('Adi Keyih Vicariate')).toBeInTheDocument()
  })

  it('renders patron saint when provided', () => {
    render(<ParishCard parish={BASE_PARISH} />)
    expect(screen.getByText(/Our Lady/)).toBeInTheDocument()
  })

  it('does not render patron saint when omitted', () => {
    render(<ParishCard parish={{ ...BASE_PARISH, patronSaint: undefined }} />)
    expect(screen.queryByText(/Our Lady/)).toBeNull()
  })

  it('renders city name when provided', () => {
    render(<ParishCard parish={BASE_PARISH} />)
    expect(screen.getByText('Segeneyti')).toBeInTheDocument()
  })

  it('does not render city when omitted', () => {
    render(<ParishCard parish={{ ...BASE_PARISH, city: undefined }} />)
    // Title is also "Segeneyti" in this fixture — use specific check
    const texts = screen.queryAllByText('Segeneyti')
    // Only the badge text should remain
    expect(texts.every((el) => el.textContent?.includes('Vicariate'))).toBe(true)
  })

  it('renders the priest name prefixed with "Fr."', () => {
    render(<ParishCard parish={BASE_PARISH} />)
    expect(screen.getByText('Fr. Tesfamariam Haile')).toBeInTheDocument()
  })

  it('does not render priest name when omitted', () => {
    render(<ParishCard parish={{ ...BASE_PARISH, priestName: undefined }} />)
    expect(screen.queryByText(/Fr\./)).toBeNull()
  })

  it('renders parish image when imageUrl is provided', () => {
    render(
      <ParishCard parish={{ ...BASE_PARISH, imageUrl: '/img/parish.jpg' }} />,
    )
    expect(screen.getByAltText('St. Mariam Parish')).toBeInTheDocument()
  })

  it('does not render an <img> when imageUrl is absent (SVG placeholder)', () => {
    render(<ParishCard parish={BASE_PARISH} />)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('renders as an <article> element', () => {
    const { container } = render(<ParishCard parish={BASE_PARISH} />)
    expect(container.querySelector('article')).toBeInTheDocument()
  })
})
