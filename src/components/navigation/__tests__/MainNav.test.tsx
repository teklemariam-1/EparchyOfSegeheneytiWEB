import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MainNav } from '../MainNav'

// MainNav is an async server component — mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(async (ns: string) => {
    const messages: Record<string, Record<string, string>> = {
      nav: {
        home: 'Home', about: 'About', aboutEparchy: 'About the Eparchy',
        bishop: 'Bishop', history: 'History', parishes: 'Parishes',
        news: 'News', events: 'Events', ministries: 'Ministries',
        allMinistries: 'All Ministries', youthCouncil: 'Youth Council',
        catechists: 'Catechists', childrenMinistry: "Children's Ministry",
        smallChristianCommunity: 'Small Christian Community',
        priestsMinistries: 'Priests & Ministries',
        resources: 'Resources', bishopMessages: "Bishop's Messages",
        popeMessages: 'Pope Messages', geezCalendar: "Ge'ez Calendar",
        publications: 'Publications', magazines: 'Magazines', archives: 'Archives',
        media: 'Media', gallery: 'Gallery', videos: 'Videos', contact: 'Contact',
      },
      a11y: {
        mainNavigation: 'Main navigation',
        mobileNavigation: 'Mobile navigation',
        skipToMain: 'Skip to main content',
        openMenu: 'Open menu', closeMenu: 'Close menu',
        logoAlt: 'Eparchy of Segeneyti logo',
        socialLinks: 'Social media links', breadcrumb: 'Breadcrumb',
      },
    }
    return (key: string) => messages[ns]?.[key] ?? key
  }),
}))

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

describe('MainNav', () => {
  it('renders a <nav> element', async () => {
    render(await MainNav())
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('nav has aria-label "Main navigation"', async () => {
    render(await MainNav())
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'Main navigation',
    )
  })

  it('renders the Home link pointing to "/"', async () => {
    render(await MainNav())
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('renders top-level direct links: Parishes, News, Events, Contact', async () => {
    render(await MainNav())
    const direct = [
      { name: 'Parishes', href: '/parishes' },
      { name: 'News', href: '/news' },
      { name: 'Events', href: '/events' },
      { name: 'Contact', href: '/contact' },
    ]
    direct.forEach(({ name, href }) => {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    })
  })

  it('renders dropdown trigger buttons for About, Ministries, Resources, Media', async () => {
    render(await MainNav())
    const dropdowns = ['About', 'Ministries', 'Resources', 'Media']
    dropdowns.forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    })
  })

  it('renders all About dropdown child links', async () => {
    render(await MainNav())
    expect(screen.getByRole('link', { name: 'About the Eparchy' })).toHaveAttribute(
      'href',
      '/about',
    )
    expect(screen.getByRole('link', { name: 'Bishop' })).toHaveAttribute(
      'href',
      '/about/bishop',
    )
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
      'href',
      '/about/history',
    )
  })

  it('renders all Ministries dropdown child links', async () => {
    render(await MainNav())
    const items = [
      { name: 'All Ministries', href: '/ministries' },
      { name: 'Youth Council', href: '/ministries/youth-council' },
      { name: 'Catechists', href: '/ministries/catechists' },
    ]
    items.forEach(({ name, href }) => {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    })
  })

  it('renders Resources dropdown with Bishop\'s Messages and Ge\'ez Calendar', async () => {
    render(await MainNav())
    expect(screen.getByRole('link', { name: "Bishop's Messages" })).toHaveAttribute(
      'href',
      '/bishop-messages',
    )
    expect(screen.getByRole('link', { name: "Ge'ez Calendar" })).toHaveAttribute(
      'href',
      '/geez-calendar',
    )
  })

  it('renders Media dropdown with Gallery and Videos links', async () => {
    render(await MainNav())
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute(
      'href',
      '/media/gallery',
    )
    expect(screen.getByRole('link', { name: 'Videos' })).toHaveAttribute(
      'href',
      '/media/videos',
    )
  })
})
