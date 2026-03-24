import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageSwitcher } from '../LanguageSwitcher'

// Spy on cookie writes and location.reload
const reloadMock = vi.fn()

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: reloadMock },
  })
  // Reset document.cookie
  document.cookie = 'NEXT_LOCALE=; max-age=0'
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('LanguageSwitcher — EN locale', () => {
  it('renders a button', () => {
    render(<LanguageSwitcher currentLocale="en" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows "ትግ" label when current locale is EN', () => {
    render(<LanguageSwitcher currentLocale="en" />)
    expect(screen.getByRole('button')).toHaveTextContent('ትግ')
  })

  it('has aria-label "Switch to ትግርኛ" when current locale is EN', () => {
    render(<LanguageSwitcher currentLocale="en" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to ትግርኛ')
  })

  it('sets NEXT_LOCALE=ti cookie and reloads on click from EN', () => {
    render(<LanguageSwitcher currentLocale="en" />)
    fireEvent.click(screen.getByRole('button'))
    expect(document.cookie).toContain('NEXT_LOCALE=ti')
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})

describe('LanguageSwitcher — TI locale', () => {
  it('shows "EN" label when current locale is Tigrinya', () => {
    render(<LanguageSwitcher currentLocale="ti" />)
    expect(screen.getByRole('button')).toHaveTextContent('EN')
  })

  it('has aria-label "Switch to English" when current locale is TI', () => {
    render(<LanguageSwitcher currentLocale="ti" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to English')
  })

  it('sets NEXT_LOCALE=en cookie and reloads on click from TI', () => {
    render(<LanguageSwitcher currentLocale="ti" />)
    fireEvent.click(screen.getByRole('button'))
    expect(document.cookie).toContain('NEXT_LOCALE=en')
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})
