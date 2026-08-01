'use client'

interface Props {
  /** Current locale resolved server-side ('en' | 'ti'). */
  currentLocale: string
  /**
   * Override the styling. The default hides the control below the `sm`
   * breakpoint because the desktop header has no room for it on a phone — but
   * the mobile drawer renders the same component and MUST show it, so the
   * breakpoint cannot be baked in.
   */
  className?: string
}

/**
 * Two-state language toggle: EN ↔ ትግርኛ.
 * Persists choice in a 1-year cookie (`NEXT_LOCALE`) and reloads the page.
 */
const DEFAULT_CLASS =
  'hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-charcoal-600 hover:bg-charcoal-50 hover:text-maroon-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700'

export function LanguageSwitcher({ currentLocale, className }: Props) {
  const isTigrinya = currentLocale === 'ti'

  const handleSwitch = () => {
    const next = isTigrinya ? 'en' : 'ti'
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className={className ?? DEFAULT_CLASS}
      aria-label={isTigrinya ? 'Switch to English' : 'Switch to ትግርኛ'}
      title={isTigrinya ? 'Switch to English' : 'Switch to ትግርኛ (Tigrinya)'}
    >
      <span aria-hidden="true">🌐</span>
      <span>{isTigrinya ? 'EN' : 'ትግ'}</span>
    </button>
  )
}
