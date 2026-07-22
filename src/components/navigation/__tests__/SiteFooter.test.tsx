import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SiteFooter } from '../SiteFooter'

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

vi.mock('@/lib/payload/queries', () => ({
  getSiteSettings: vi.fn().mockResolvedValue({}),
  getFooterGlobal: vi.fn().mockResolvedValue({
    columns: [
      {
        heading: 'Links',
        links: [
          { label: 'Vatican News', url: 'https://www.vaticannews.va', newTab: true },
          { label: 'About', url: '/about' },
        ],
      },
    ],
  }),
}))

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
})
