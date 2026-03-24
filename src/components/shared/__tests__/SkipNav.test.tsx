import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkipNav } from '../SkipNav'

// SkipNav is an async server component — mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(async (ns: string) => {
    const messages: Record<string, Record<string, string>> = {
      a11y: {
        skipToMain: 'Skip to main content',
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        mainNavigation: 'Main navigation',
        mobileNavigation: 'Mobile navigation',
        logoAlt: 'Eparchy of Segeneyti logo',
        socialLinks: 'Social media links',
        breadcrumb: 'Breadcrumb',
      },
    }
    return (key: string) => messages[ns]?.[key] ?? key
  }),
}))

describe('SkipNav', () => {
  it('renders a link', async () => {
    render(await SkipNav())
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('href points to #main-content', async () => {
    render(await SkipNav())
    expect(screen.getByRole('link')).toHaveAttribute('href', '#main-content')
  })

  it('link text is the translated skip message', async () => {
    render(await SkipNav())
    expect(screen.getByRole('link')).toHaveTextContent('Skip to main content')
  })

  it('is visually hidden by default via sr-only class', async () => {
    render(await SkipNav())
    expect(screen.getByRole('link').className).toMatch(/sr-only/)
  })
})
