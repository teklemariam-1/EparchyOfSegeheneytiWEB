import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SiteFooter } from '../SiteFooter'
import { getFooterGlobal } from '@/lib/payload/queries'

// SiteFooter is an async server component — mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(async () => (key: string) => key),
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/features/newsletter/NewsletterForm', () => ({
  NewsletterForm: () => null,
}))

const DEFAULT_FOOTER = {
  columns: [
    {
      heading: 'Links',
      links: [
        { label: 'Vatican News', url: 'https://www.vaticannews.va', newTab: true },
        { label: 'About', url: '/about' },
      ],
    },
  ],
}

vi.mock('@/lib/payload/queries', () => ({
  getSiteSettings: vi.fn().mockResolvedValue({}),
  getFooterGlobal: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(getFooterGlobal).mockResolvedValue(DEFAULT_FOOTER)
})

describe('SiteFooter', () => {
  it('opens links with newTab enabled in a new tab, others in the same tab', async () => {
    render(await SiteFooter())

    const external = screen.getByRole('link', { name: 'Vatican News' })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')

    const internal = screen.getByRole('link', { name: 'About' })
    expect(internal).not.toHaveAttribute('target')
    expect(internal).not.toHaveAttribute('rel')
  })

  it('honours newTab on the bottom bar links', async () => {
    vi.mocked(getFooterGlobal).mockResolvedValue({
      ...DEFAULT_FOOTER,
      bottomLinks: [
        { label: 'Privacy', url: '/privacy' },
        { label: 'Diocesan Portal', url: 'https://portal.example.org', newTab: true },
      ],
    })
    render(await SiteFooter())

    const sameTab = screen.getByRole('link', { name: 'Privacy' })
    expect(sameTab).not.toHaveAttribute('target')

    const newTab = screen.getByRole('link', { name: 'Diocesan Portal' })
    expect(newTab).toHaveAttribute('target', '_blank')
    expect(newTab).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('widens long link columns and sizes the grid to the total track count', async () => {
    vi.mocked(getFooterGlobal).mockResolvedValue({
      columns: [
        { heading: 'Short', links: [{ label: 'One', url: '/one' }] },
        {
          heading: 'Long',
          links: Array.from({ length: 12 }, (_, i) => ({
            label: `Item ${i}`,
            url: `/item-${i}`,
          })),
        },
      ],
    })
    const { container } = render(await SiteFooter())

    // 1 track for the short column + 2 for the long one.
    const region = container.querySelector('[style*="--footer-tracks"]') as HTMLElement
    expect(region.style.getPropertyValue('--footer-tracks')).toBe('3')

    const long = screen.getByRole('heading', { name: 'Long' }).parentElement!
    expect(long.className).toContain('sm:col-span-2')
    expect(long.querySelector('ul')!.className).toContain('sm:columns-2')

    const short = screen.getByRole('heading', { name: 'Short' }).parentElement!
    expect(short.className).not.toContain('col-span-2')
    expect(short.querySelector('ul')!.className).not.toContain('columns-2')
  })

  it('falls back to single-width columns when the tracks would get too narrow', async () => {
    vi.mocked(getFooterGlobal).mockResolvedValue({
      columns: Array.from({ length: 4 }, (_, c) => ({
        heading: `Col ${c}`,
        links: Array.from({ length: 10 }, (_, i) => ({
          label: `C${c} item ${i}`,
          url: `/c${c}-${i}`,
        })),
      })),
    })
    const { container } = render(await SiteFooter())

    const region = container.querySelector('[style*="--footer-tracks"]') as HTMLElement
    expect(region.style.getPropertyValue('--footer-tracks')).toBe('4')
    expect(screen.getByRole('heading', { name: 'Col 0' }).parentElement!.className).not.toContain(
      'col-span-2',
    )
  })
})
