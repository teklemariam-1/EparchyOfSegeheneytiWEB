import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewsCard, type NewsCardData } from '../NewsCard'

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
  default: ({
    src,
    alt,
    className,
  }: {
    src: string
    alt: string
    className?: string
    fill?: boolean
    sizes?: string
  }) => <img src={src} alt={alt} className={className} />,
}))

const BASE_NEWS: NewsCardData = {
  slug: 'synod-announcement-2026',
  title: 'Synod of the Catholic Eparchy 2026',
  excerpt: 'The annual synod will take place in Segeneyti this year...',
  category: 'eparchy',
  publishedAt: '2026-03-24T12:00:00Z',
}

describe('NewsCard', () => {
  it('renders the article title', () => {
    render(<NewsCard news={BASE_NEWS} />)
    expect(screen.getByText(BASE_NEWS.title)).toBeInTheDocument()
  })

  it('links the title to the correct news detail URL', () => {
    render(<NewsCard news={BASE_NEWS} />)
    expect(
      screen.getByRole('link', { name: BASE_NEWS.title }),
    ).toHaveAttribute('href', `/news/${BASE_NEWS.slug}`)
  })

  it('renders the article excerpt', () => {
    render(<NewsCard news={BASE_NEWS} />)
    expect(screen.getByText(BASE_NEWS.excerpt)).toBeInTheDocument()
  })

  it('renders the category badge with first letter capitalised', () => {
    render(<NewsCard news={BASE_NEWS} />)
    expect(screen.getByText('Eparchy')).toBeInTheDocument()
  })

  it('renders "Read more" text', () => {
    render(<NewsCard news={BASE_NEWS} />)
    expect(screen.getByText(/Read more/i)).toBeInTheDocument()
  })

  it('renders an <img> when imageUrl is provided', () => {
    render(
      <NewsCard
        news={{ ...BASE_NEWS, imageUrl: '/img/synod.jpg', imageAlt: 'Synod photo' }}
      />,
    )
    expect(screen.getByAltText('Synod photo')).toBeInTheDocument()
  })

  it('uses the title as img alt when imageAlt is omitted', () => {
    render(
      <NewsCard news={{ ...BASE_NEWS, imageUrl: '/img/synod.jpg' }} />,
    )
    expect(screen.getByAltText(BASE_NEWS.title)).toBeInTheDocument()
  })

  it('does not render an <img> when imageUrl is absent (uses SVG placeholder)', () => {
    render(<NewsCard news={BASE_NEWS} />)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('renders as an <article> element', () => {
    const { container } = render(<NewsCard news={BASE_NEWS} />)
    expect(container.querySelector('article')).toBeInTheDocument()
  })

  it('applies flex-row layout for the featured variant', () => {
    const { container } = render(<NewsCard news={BASE_NEWS} featured />)
    expect(container.querySelector('article')).toHaveClass('md:flex-row')
  })

  it('formats and displays the publication date', () => {
    render(<NewsCard news={BASE_NEWS} />)
    const dateEl = document.querySelector('time')
    expect(dateEl).toBeInTheDocument()
    expect(dateEl).toHaveAttribute('dateTime', BASE_NEWS.publishedAt)
  })
})
