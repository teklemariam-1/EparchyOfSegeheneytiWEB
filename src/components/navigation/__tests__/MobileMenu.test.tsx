import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileMenu } from '../MobileMenu'

// Mock next-intl useTranslations
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    const messages: Record<string, Record<string, string>> = {
      nav: {
        home: 'Home', about: 'About', bishop: 'Bishop', parishes: 'Parishes',
        news: 'News', events: 'Events', ministries: 'Ministries',
        youthCouncil: 'Youth Council', catechists: 'Catechists',
        bishopMessages: "Bishop's Messages", popeMessages: 'Pope Messages',
        geezCalendar: "Ge'ez Calendar", publications: 'Publications',
        media: 'Media', contact: 'Contact',
      },
      a11y: {
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        mobileNavigation: 'Mobile navigation',
      },
    }
    return (key: string) => messages[ns]?.[key] ?? key
  },
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}))

afterEach(() => {
  vi.clearAllMocks()
  // Reset body overflow in case a test leaves it set
  document.body.style.overflow = ''
})

describe('MobileMenu — closed state', () => {
  it('renders the open-menu toggle button', () => {
    render(<MobileMenu />)
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('toggle button has aria-expanded="false" initially', () => {
    render(<MobileMenu />)
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('drawer dialog is not visible initially', () => {
    render(<MobileMenu />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('MobileMenu — open state', () => {
  it('clicking the toggle button opens the drawer', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('drawer has aria-modal="true"', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('toggle button aria-expanded becomes "true" when open', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('renders all expected nav links in the drawer', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const expectedLabels = [
      'Home', 'About', 'Bishop', 'Parishes', 'News', 'Events',
      'Ministries', 'Youth Council', 'Catechists', "Bishop's Messages",
      'Pope Messages', "Ge'ez Calendar", 'Publications', 'Media', 'Contact',
    ]
    expectedLabels.forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    })
  })

  it('renders a visible close button', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()
  })

  it('locks body scroll when open', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(document.body.style.overflow).toBe('hidden')
  })
})

describe('MobileMenu — closing', () => {
  it('close button dismisses the drawer', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('pressing Escape closes the drawer', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('clicking a nav link closes the drawer', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    fireEvent.click(screen.getByRole('link', { name: 'News' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('restores body scroll after closing', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(document.body.style.overflow).toBe('')
  })

  it('clicking the backdrop closes the drawer', () => {
    render(<MobileMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    fireEvent.click(screen.getByTestId('mobile-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
